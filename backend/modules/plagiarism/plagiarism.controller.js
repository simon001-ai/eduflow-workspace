import authMiddleware from '../../middleware/auth.middleware.js';
import { rateLimiter } from '../../middleware/rateLimiter.middleware.js';
import { getSupabase } from '../../src/config/supabaseClient.js';
import { submitDocumentForAnalysis } from '../../utils/plagiarismChecker.js'; // Now uses Winston AI
import { createPlagiarismAnalysis, updatePlagiarismAnalysis, getPlagiarismAnalysis } from './plagiarism.service.js';
import { compareTexts } from '../document_analysis/winstonService.js';
import { extractTextFromFile } from '../document_analysis/textExtraction.service.js';
import multer from 'multer';
import path from 'path';
import { detectAIContent } from '../document_analysis/winstonService.js';
// Helper: sanitize input
function sanitizeInput(input) {
    if (typeof input === 'string') {
        return input.replace(/[<>]/g, '').trim();
    }
    return input;
}

// Multer config: PDF/DOCX only, max 20MB
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const timestamp = Date.now();
            const { resource_id, student_id } = req.body;
            cb(null, `${resource_id}_${student_id}_${timestamp}${ext}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowed.includes(ext)) return cb(new Error('Only PDF and DOCX files allowed'));
        cb(null, true);
    },
    limits: { fileSize: 20 * 1024 * 1024 }
});

export { upload };

let ioInstance = null;
export function setSocketIo(io) { ioInstance = io; }

// GET /api/plagiarism/analyze/result/:scanId - Poll for analysis result
export async function getAnalysisResultController(req, res, next) {
    try {
        const { scanId } = req.params;
        const supabase = getSupabase();
        // Fetch submission
        const { data: submission, error: submissionErr } = await supabase.from('submissions').select('*').eq('id', scanId).maybeSingle();
        if (submissionErr || !submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }
        // Fetch plagiarism reports
        const { data: reports, error: reportsErr } = await supabase.from('plagiarism_analysis').select('*').eq('submission_id', scanId);
        if (reportsErr) {
            return res.status(500).json({ success: false, message: 'Error fetching plagiarism reports', error: reportsErr.message });
        }
        // Fetch AI detection report
        const { data: aiReport, error: aiErr } = await supabase.from('ai_detection_reports').select('*').eq('submission_id', scanId).maybeSingle();
        // Build response with ai_score and plagiarism_percentage
        res.json({
            success: true,
            submission_id: scanId,
            ai_score: aiReport?.ai_probability || null,
            ai_probability: aiReport?.ai_probability || null,
            human_probability: aiReport?.human_probability || null,
            plagiarism_percentage: submission.plagiarism_percentage || 0,
            file_url: submission.file_url,
            extracted_text: submission.extracted_text,
            status: submission.status,
            ai_detection_report: aiReport || null,
            plagiarism_reports: reports || [],
            message: 'Analysis result fetched successfully'
        });
    } catch (e) {
        next(e);
    }
}

// Secure analyzeDocument endpoint
export const secureAnalyzeDocument = [
    authMiddleware,
    rateLimiter,
    (req, res, next) => {
        // Debug logs to confirm multer execution
        console.log('DEBUG (sanitization): req.file:', req.file);
        console.log('DEBUG (sanitization): req.body:', req.body);
        // File type/size validation already handled by multer
        // Input sanitization
        req.body.resource_id = sanitizeInput(req.body.resource_id);
        req.body.student_id = sanitizeInput(req.body.student_id);
        next();
    },
    analyzeDocument
];

// POST /api/plagiarism/analyze - Document upload and trigger plagiarism analysis
export async function analyzeDocument(req, res, next) {
    // Debug log for form-data parsing
    console.log('DEBUG analyzeDocument req.body:', req.body);
    console.log('DEBUG analyzeDocument req.file:', req.file);
    console.log('DEBUG analyzeDocument req.headers["content-type"]:', req.headers['content-type']);
    console.log('DEBUG analyzeDocument Object.keys(req.body):', Object.keys(req.body));
    console.log('DEBUG analyzeDocument Object.keys(req):', Object.keys(req));
    try {
        const { resource_id, student_id } = req.body;
        if (!resource_id || !student_id || !req.file) {
            return res.status(400).json({ success: false, message: 'Missing resource_id, student_id, or file' });
        }
        // Extract text
        const filePath = `uploads/${req.file.filename}`;
        let extractedText = '';
        try {
            console.log('[Plagiarism Controller] Attempting text extraction from:', filePath);
            extractedText = await extractTextFromFile(filePath);
        } catch (extractErr) {
            console.error('[Plagiarism Controller] Text extraction failed:', extractErr.message);
            // Check if it's a scanned PDF error
            if (extractErr.message.includes('scanned') || extractErr.message.includes('image-based')) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'PDF is not text-extractable', 
                    error: extractErr.message,
                    suggestion: 'Please upload a PDF with selectable text, not a scanned image PDF.'
                });
            }
            return res.status(400).json({ success: false, message: 'Text extraction failed', error: extractErr.message });
        }
        // Insert submission record
        const supabase = getSupabase();
        const { data: submission, error: submissionErr } = await supabase.from('submissions').insert({
            student_id,
            resource_id,
            file_url: filePath,
            extracted_text: extractedText,
            created_at: new Date().toISOString()
        }).select('*').single();
        if (submissionErr) throw submissionErr;

        // --- AI Detection (Winston) ---
        let aiReport = null;
        try {
            console.log('[Plagiarism Controller] Calling detectAIContent with text length:', extractedText.length);
            console.log('[Plagiarism Controller] Text preview (first 200 chars):', extractedText.substring(0, 200));
            aiReport = await detectAIContent(extractedText);
            console.log('[Plagiarism Controller] detectAIContent success:', aiReport);
        } catch (aiErr) {
            console.warn('[Plagiarism Controller] detectAIContent failed:', aiErr.message);
            // If text is too short, just log warning and continue without AI detection
            if (aiErr.message.includes('at least 300 characters')) {
                console.warn('[Plagiarism Controller] Text too short for AI detection, proceeding without it');
                aiReport = null; // Set to null, we'll handle this later
            } else {
                // For other AI errors, still fail the request
                return res.status(400).json({ success: false, message: 'AI detection failed', error: aiErr.message });
            }
        }
        // Store AI detection report (only if analysis was successful)
        if (aiReport) {
            await supabase.from('ai_detection_reports').insert({
                submission_id: submission.id,
                ai_probability: aiReport.score,
                human_probability: 100 - aiReport.score,
                sentence_level_analysis: aiReport.sentences,
                created_at: new Date().toISOString()
            });
            // Update submission with AI probability and is_ai_generated
            await supabase.from('submissions').update({
                ai_score: aiReport.score,
                is_ai_generated: aiReport.score > 50 // or your preferred threshold
            }).eq('id', submission.id);
        } else {
            console.log('[Plagiarism Controller] Skipping AI detection report storage - no analysis available');
        }

        // Fetch previous submissions for resource
        const { data: previousSubs, error: prevErr } = await supabase.from('submissions').select('id, extracted_text').eq('resource_id', resource_id).neq('id', submission.id);
        if (prevErr) throw prevErr;
        let highestScore = 0;
        if (previousSubs.length > 0) {
            // Compare with each previous submission
            const comparePromises = previousSubs.map(async (sub) => {
                try {
                    console.log('DEBUG: Sending to Winston - First text (first 200 chars):', extractedText.substring(0, 200));
                    console.log('DEBUG: Sending to Winston - Second text (first 200 chars):', sub.extracted_text.substring(0, 200));
                    const result = await compareTexts(extractedText, sub.extracted_text);
                    console.log('DEBUG: Winston response:', result);
                    return result;
                } catch (compareErr) {
                    console.error('DEBUG: compareTexts failed for submission', sub.id, 'Error:', compareErr.message, 'Response:', compareErr.response?.data);
                    // Return a default or skip
                    return { similarity_score: 0, matching_segments: [] };
                }
            });
            const compareResults = await Promise.all(comparePromises);
            // Find highest similarity
            for (let i = 0; i < compareResults.length; i++) {
                const score = compareResults[i].similarity_score;
                if (score > highestScore) highestScore = score;
                // Store plagiarism report
                await supabase.from('plagiarism_analysis').insert({
                    submission_id: submission.id,
                    compared_submission_id: previousSubs[i].id,
                    similarity_score: score,
                    matching_segments: compareResults[i],
                    created_at: new Date().toISOString()
                });
            }
        } else {
            // No previous submissions, so set plagiarism_score to 0 (or another default)
            highestScore = 0;
        }
        // Always update submission with highest plagiarism percentage and ensure ai_score is set
        const updateData = { plagiarism_percentage: highestScore };
        if (aiReport && typeof aiReport.score === 'number') {
            updateData.ai_score = aiReport.score;
        }
        await supabase.from('submissions').update(updateData).eq('id', submission.id);
        
        // Fetch final submission with all analysis data
        const { data: finalSubmission } = await supabase.from('submissions').select('*').eq('id', submission.id).maybeSingle();
        
        res.json({
            success: true,
            submission_id: submission.id,
            ai_score: finalSubmission?.ai_score || null,
            plagiarism_percentage: finalSubmission?.plagiarism_percentage || highestScore,
            message: 'Submission analyzed successfully'
        });
    } catch (e) {
        next(e);
    }
}

// POST /api/plagiarism/check - Simulated/legacy plagiarism check
export async function checkPlagiarism(req, res, next) {
  try {
    const { resource_id, student_id } = req.body;
    if (!resource_id || !student_id) {
      return res.status(400).json({ success: false, message: 'Missing resource_id or student_id' });
    }
    // Simulate plagiarism check (legacy)
    const scanId = await createPlagiarismAnalysis(student_id, resource_id);
    // Simulate result
    await updatePlagiarismAnalysis(scanId, { score: 0 });
    const result = await getPlagiarismAnalysis(scanId);
    // Emit event if socket available
    if (ioInstance) {
      ioInstance.to(`user:${student_id}`).emit('plagiarism_complete', { scanId, result });
    }
    res.json({ success: true, scanId, result });
  } catch (e) {
    next(e);
  }
}

// POST /api/analyze - Document upload and trigger analysis

// GET /api/analyze/result/:scanId - Poll for analysis result

/**
 * Student triggers a plagiarism check
 * Body: { resource_id }
 * Emits: 'plagiarism_complete' to user:{studentId} when done
 */