import { extractTextFromFile } from './textExtraction.service.js';
import { detectAIContent, compareTexts } from './winstonService.js';
import { getSupabase } from '../../src/config/supabaseClient.js';
import { getSupabase } from '../../src/config/supabaseClient.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Multer config: PDF/DOCX only, max 20MB
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const timestamp = Date.now();
      const { assignment_id, student_id } = req.body;
      cb(null, `${assignment_id}_${student_id}_${timestamp}${ext}`);
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

// POST /api/document-analysis/upload
export function uploadDocument(req, res, next) {
  upload.single('file')(req, res, async function (err) {
    if (err) return res.status(400).json({ success: false, message: err.message });
    try {
      const { resources_id, student_id } = req.body;
      if (!resources_id || !student_id) {
        return res.status(400).json({ success: false, message: 'Missing resources_id or student_id' });
      }
      // Save file locally
      const fileUrl = `/uploads/${req.file.filename}`;
      // TODO: Upload to Supabase Storage (assignment-submissions bucket)
      // Extract text
      let extractedText = '';
      try {
        extractedText = await extractTextFromFile(`uploads/${req.file.filename}`);
      } catch (extractErr) {
        return res.status(400).json({ success: false, message: 'Text extraction failed', error: extractErr.message });
      }
      // Run Winston AI detection
      let aiReport;
      try {
        aiReport = await detectAIContent(extractedText);
      } catch (aiErr) {
        return res.status(400).json({ success: false, message: 'AI detection failed', error: aiErr.message });
      }
      // Insert submission record
      const supabase = getSupabase();
      const { data: submission, error: submissionErr } = await supabase.from('submissions').insert({
        student_id,
        assignment_id,
        file_url: fileUrl,
        extracted_text: extractedText,
        ai_score: aiReport.score,
        created_at: new Date().toISOString()
      }).select('*').single();
      if (submissionErr) throw submissionErr;
      // Store AI detection report
      await supabase.from('ai_detection_reports').insert({
        submission_id: submission.id,
        ai_probability: aiReport.score,
        human_probability: 100 - aiReport.score,
        sentence_level_analysis: aiReport.sentences,
        created_at: new Date().toISOString()
      });
      // Plagiarism detection
      const { data: previousSubs, error: prevErr } = await supabase.from('submissions').select('id, extracted_text').eq('assignment_id', assignment_id).neq('id', submission.id);
      if (prevErr) throw prevErr;
      const comparePromises = previousSubs.map(sub => compareTexts(extractedText, sub.extracted_text));
      const compareResults = await Promise.all(comparePromises);
      let highestScore = 0;
      for (let i = 0; i < compareResults.length; i++) {
        const score = compareResults[i].similarity_score;
        if (score > highestScore) highestScore = score;
        await supabase.from('plagiarism_reports').insert({
          submission_id: submission.id,
          compared_submission_id: previousSubs[i].id,
          similarity_score: score,
          matching_segments: compareResults[i],
          created_at: new Date().toISOString()
        });
      }
      await supabase.from('submissions').update({ plagiarism_percentage: highestScore }).eq('id', submission.id);
      res.json({
        success: true,
        submission_id: submission.id,
        ai_score: aiReport.score,
        plagiarism_percentage: highestScore,
        message: 'Submission analyzed successfully'
      });
    } catch (e) {
      next(e);
    }
  });
}
