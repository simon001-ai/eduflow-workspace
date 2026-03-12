import { getSupabase } from '../../src/config/supabaseClient.js';
import { compareTexts } from './winstonService.js';

export async function runPlagiarismPipeline(submissionId, assignmentId, extractedText) {
  const supabase = getSupabase();
  // Fetch previous submissions
  const { data: previousSubs, error: prevErr } = await supabase.from('submissions').select('id, extracted_text').eq('assignment_id', assignmentId);
  if (prevErr) throw prevErr;
  // Compare with each previous submission
  const comparePromises = previousSubs.map(sub => compareTexts(extractedText, sub.extracted_text));
  const compareResults = await Promise.all(comparePromises);
  // Find highest similarity
  let highestScore = 0;
  for (let i = 0; i < compareResults.length; i++) {
    const score = compareResults[i].similarity_score;
    if (score > highestScore) highestScore = score;
    // Store plagiarism report
    await supabase.from('plagiarism_reports').insert({
      submission_id,
      compared_submission_id: previousSubs[i].id,
      similarity_score: score,
      matching_segments: compareResults[i],
      created_at: new Date().toISOString()
    });
  }
  // Update submission with highest score
  await supabase.from('submissions').update({ plagiarism_score: highestScore }).eq('id', submissionId);
  return highestScore;
}
