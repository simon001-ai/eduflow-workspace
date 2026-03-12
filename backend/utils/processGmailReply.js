import { getSupabase } from '../src/config/supabaseClient.js';

export async function processGmailReply({ from, subject, body, threadId }) {
  // Find sender/receiver by email (assume student/lecturer distinction)
  const supabase = getSupabase();
  // Try to find student by email
  let { data: student, error: stuErr } = await supabase.from('students').select('id').eq('email', from).maybeSingle();
  // Try to find lecturer by email
  let { data: lecturer, error: lecErr } = await supabase.from('lecturers').select('id').eq('institutional_email', from).maybeSingle();
  let senderType, senderId;
  if (student) { senderType = 'student'; senderId = student.id; }
  else if (lecturer) { senderType = 'lecturer'; senderId = lecturer.id; }
  else { senderType = 'unknown'; senderId = null; }

  // For demo, set receiver to system or null
  let receiverType = senderType === 'student' ? 'lecturer' : 'student';
  let receiverId = null; // You may want to look up the original sender from threadId

  // Save message in DB
  const { data: msg, error: msgErr } = await supabase.from('messages').insert({
    sender_type: senderType,
    sender_id: senderId,
    receiver_type: receiverType,
    receiver_id: receiverId,
    subject,
    body,
    created_at: new Date().toISOString(),
    // Optionally link to thread/conversation
    thread_id: threadId || null
  }).select('*').single();
  if (msgErr) throw msgErr;

  // Notify user (insert notification)
  if (receiverId) {
    await supabase.from('notifications').insert({
      student_id: receiverType === 'student' ? receiverId : null,
      resource_id: null,
      type: 'note_uploaded', // Or custom type for reply
      title: `New reply from ${from}`,
      created_at: new Date().toISOString()
    });
  }
  return msg;
}
