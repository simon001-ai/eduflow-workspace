import { getSupabase } from '../../src/config/supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new plagiarism analysis record in Supabase and return the scanId (UUID)
 * @param {string} studentId
 * @param {string} resourceId
 * @returns {Promise<string>} scanId
 */
export async function createPlagiarismAnalysis(studentId, resourceId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('plagiarism_analysis')
    .insert({
      id: uuidv4(),
      student_id: studentId,
      resource_id: resourceId,
      status: 'pending',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

/**
 * Update plagiarism analysis record with result
 * @param {string} scanId
 * @param {object} result
 */
export async function updatePlagiarismAnalysis(scanId, result) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('plagiarism_analysis')
    .update({
      status: 'complete',
      percentage: result.score,
      completed_at: new Date().toISOString(),
    })
    .eq('id', scanId);
  if (error) throw error;
}

/**
 * Get plagiarism analysis result by scanId
 * @param {string} scanId
 * @returns {Promise<object>}
 */
export async function getPlagiarismAnalysis(scanId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('plagiarism_analysis')
    .select('*')
    .eq('id', scanId)
    .single();
  if (error) throw error;
  return data;
}
