// List available CATs for the student
export async function listCATs(req, res, next) {
  try {
    const studentId = req.user.student_id;
    const supabase = getSupabase();
    // Get units student is registered for
    const { data: regs, error: regErr } = await supabase
      .from('student_unit_registrations')
      .select('unit_id')
      .eq('student_id', studentId);
    if (regErr) throw regErr;
    const unitIds = (regs || []).map(r => r.unit_id);
    // Get CATs for those units
    const { data: cats, error: catErr } = await supabase
      .from('resources')
      .select('*')
      .in('unit_id', unitIds)
      .eq('type', 'cat');
    if (catErr) throw catErr;
    res.json({ success: true, data: cats });
  } catch (e) {
    next(e);
  }
}

// Get CAT details
export async function getCAT(req, res, next) {
  try {
    const { catId } = req.params;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', catId)
      .maybeSingle();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

// Submit CAT answers (with timer validation for timed CATs)
export async function submitCAT(req, res, next) {
  try {
    const studentId = req.user.student_id;
    const { catId } = req.params;
    const { file_path, content_text, started_at, ended_at } = req.body;
    const supabase = getSupabase();
    // Get CAT resource
    const { data: cat, error: catErr } = await supabase
      .from('resources')
      .select('id, metadata')
      .eq('id', catId)
      .maybeSingle();
    if (catErr || !cat) throw catErr || new Error('CAT not found');
    // Timer validation if timed
    const isTimed = cat.metadata?.is_timed;
    if (isTimed && cat.metadata.cat_duration_minutes) {
      const allowedMs = cat.metadata.cat_duration_minutes * 60 * 1000;
      const actualMs = new Date(ended_at) - new Date(started_at);
      if (actualMs > allowedMs + 10000) { // 10s grace
        return res.status(400).json({ success: false, message: 'Time exceeded for timed CAT' });
      }
    }
    // Insert submission
    const { data: submission, error: subErr } = await supabase.from('submissions').insert({
      student_id: studentId,
      resource_id: catId,
      file_path,
      content_text,
      submitted_at: ended_at || new Date().toISOString(),
    }).select('*').single();
    if (subErr) throw subErr;
    res.status(201).json({ success: true, data: submission });
  } catch (e) {
    next(e);
  }
}
import { getSupabase } from '../../src/config/supabaseClient.js';
import { recommendPapers } from '../../utils/semanticScholar.js'; // Now uses Exa AI

// Save or update a draft with PDF conversion
export async function saveDraft(req, res, next) {
  try {
    const studentId = req.user.student_id;
    const { resource_id, title, content } = req.body;
    const supabase = getSupabase();
    
    if (!resource_id || !content) {
      return res.status(400).json({ success: false, message: 'Missing resource_id or content' });
    }

    // Convert content to PDF
    const { default: PDFDocument } = await import('pdfkit');
    const { createWriteStream } = await import('fs');
    const { join } = await import('path');
    const { v4: uuidv4 } = await import('uuid');

    const timestamp = Date.now();
    const filename = `draft_${studentId}_${resource_id}_${timestamp}.pdf`;
    const uploadsPath = join(process.cwd(), 'uploads', filename);
    
    await new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = createWriteStream(uploadsPath);
      
      doc.pipe(stream);
      doc.fontSize(11)
        .font('Helvetica')
        .text(content, {
          align: 'left',
          width: 500,
          height: 700
        });
      doc.end();
      
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Check if draft exists for this student and resource
    const { data: existingDraft, error: checkErr } = await supabase
      .from('saved_drafts')
      .select('id')
      .eq('student_id', studentId)
      .eq('resource_id', resource_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let draft;
    if (existingDraft) {
      // Update existing draft
      const { data: updated, error: updateErr } = await supabase
        .from('saved_drafts')
        .update({
          content,
          file_path: filename,
          file_url: `/uploads/${filename}`,
          draft_title: title || 'Untitled Draft',
          last_saved: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDraft.id)
        .select('*')
        .single();

      if (updateErr) throw updateErr;
      draft = updated;
    } else {
      // Create new draft
      const { data: created, error: createErr } = await supabase
        .from('saved_drafts')
        .insert({
          student_id: studentId,
          resource_id,
          content,
          file_path: filename,
          file_url: `/uploads/${filename}`,
          draft_title: title || 'Untitled Draft',
          last_saved: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (createErr) throw createErr;
      draft = created;
    }

    res.json({
      success: true,
      message: 'Draft saved successfully',
      data: draft
    });
  } catch (e) {
    console.error('Save draft error:', e);
    next(e);
  }
}

// Get a draft for a resource
export async function getDraft(req, res, next) {
  try {
    const studentId = req.user.student_id;
    const { resourceId } = req.params;
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('saved_drafts')
      .select('*')
      .eq('student_id', studentId)
      .eq('resource_id', resourceId)
      .order('last_saved', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    res.json({ success: true, data: data && data.length > 0 ? data[0] : null });
  } catch (e) {
    next(e);
  }
}

// Delete a draft
export async function deleteDraft(req, res, next) {
  try {
    const studentId = req.user.student_id;
    const { draftId } = req.params;
    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('saved_drafts')
      .delete()
      .eq('id', draftId)
      .eq('student_id', studentId);
    
    if (error) throw error;
    res.json({ success: true, message: 'Draft deleted successfully' });
  } catch (e) {
    next(e);
  }
}

// Get all drafts for a student
export async function getAllDrafts(req, res, next) {
  try {
    const studentId = req.user.student_id;
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('saved_drafts')
      .select(`
        *,
        resources(id, title, type, unit_id, units(id, code, name))
      `)
      .eq('student_id', studentId)
      .order('last_saved', { ascending: false });
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      data: data || [],
      message: 'All drafts fetched successfully'
    });
  } catch (e) {
    next(e);
  }
}

// Turn in assignment: Convert to PDF and submit for analysis
export async function turnInAssignment(req, res, next) {
  try {
    const studentId = req.user.student_id;
    const { resource_id, content } = req.body;
    const supabase = getSupabase();
    
    if (!resource_id || !content) {
      return res.status(400).json({ success: false, message: 'Missing resource_id or content' });
    }

    // Convert content to PDF
    const { default: PDFDocument } = await import('pdfkit');
    const { createWriteStream } = await import('fs');
    const { join } = await import('path');

    const timestamp = Date.now();
    const filename = `submission_${studentId}_${resource_id}_${timestamp}.pdf`;
    const uploadsPath = join(process.cwd(), 'uploads', filename);
    
    await new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = createWriteStream(uploadsPath);
      
      doc.pipe(stream);
      doc.fontSize(11)
        .font('Helvetica')
        .text(content, {
          align: 'left',
          width: 500,
          height: 700
        });
      doc.end();
      
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Create submission record with status='analyzing' 
    const { data: submission, error: submissionErr } = await supabase
      .from('submissions')
      .insert({
        student_id: studentId,
        resource_id,
        file_url: `/uploads/${filename}`,
        file_path: filename,
        extracted_text: content,
        status: 'analyzing',
        submitted_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (submissionErr) throw submissionErr;

    // Trigger plagiarism analysis asynchronously
    triggerPlagiarismAnalysis(submission.id, studentId, resource_id, content).catch(err => {
      console.error('Async plagiarism analysis error:', err);
    });

    res.json({
      success: true,
      message: 'Assignment submitted and queued for analysis',
      submission_id: submission.id,
      data: submission
    });
  } catch (e) {
    console.error('Turn in assignment error:', e);
    next(e);
  }
}

// Helper function to trigger plagiarism analysis asynchronously
async function triggerPlagiarismAnalysis(submissionId, studentId, resourceId, extractedText) {
  try {
    const { detectAIContent } = await import('../document_analysis/winstonService.js');
    const { compareTexts } = await import('../document_analysis/winstonService.js');
    
    const supabase = getSupabase();
    
    // --- AI Detection ---
    let aiReport = null;
    try {
      console.log('[Workspace] Calling detectAIContent for submission:', submissionId);
      aiReport = await detectAIContent(extractedText);
      console.log('[Workspace] detectAIContent success:', aiReport);
      
      // Store AI detection report
      if (aiReport) {
        await supabase.from('ai_detection_reports').insert({
          submission_id: submissionId,
          ai_probability: aiReport.score,
          human_probability: 100 - aiReport.score,
          sentence_level_analysis: aiReport.sentences,
          created_at: new Date().toISOString()
        });
        
        // Update submission with AI score
        await supabase.from('submissions').update({
          ai_score: aiReport.score,
          is_ai_generated: aiReport.score > 50
        }).eq('id', submissionId);
      }
    } catch (aiErr) {
      console.warn('[Workspace] detectAIContent failed:', aiErr.message);
    }

    // --- Compare with previous submissions ---
    const { data: previousSubs } = await supabase
      .from('submissions')
      .select('id, extracted_text')
      .eq('resource_id', resourceId)
      .neq('id', submissionId);

    let highestScore = 0;
    if (previousSubs && previousSubs.length > 0) {
      const comparePromises = previousSubs.map(async (sub) => {
        try {
          const result = await compareTexts(extractedText, sub.extracted_text);
          return result;
        } catch (compareErr) {
          console.error('[Workspace] compareTexts failed:', compareErr.message);
          return { similarity_score: 0, matching_segments: [] };
        }
      });

      const compareResults = await Promise.all(comparePromises);
      
      for (const result of compareResults) {
        if (result.similarity_score > highestScore) {
          highestScore = result.similarity_score;
        }
      }
    }

    // Update submission with plagiarism percentage and mark as submitted
    await supabase.from('submissions').update({
      plagiarism_percentage: Math.round(highestScore),
      status: 'submitted'
    }).eq('id', submissionId);

    console.log('[Workspace] Analysis complete for submission:', submissionId);
  } catch (err) {
    console.error('[Workspace] triggerPlagiarismAnalysis error:', err);
  }
}

// AI recommend endpoint
export async function aiRecommend(req, res, next) {
  try {
    const { text } = req.body;
    const papers = await recommendPapers(text);
    res.json({ success: true, papers });
  } catch (e) {
    next(e);
  }
}
