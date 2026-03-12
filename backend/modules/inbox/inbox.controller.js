// Mark email as spam
export async function markSpam(req, res, next) {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { data, error } = await supabase.from('messages')
      .update({ folder: 'spam', isSpam: true })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

// Unmark email as spam
export async function unmarkSpam(req, res, next) {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { data, error } = await supabase.from('messages')
      .update({ folder: 'inbox', isSpam: false })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}
import { getSupabase } from '../../src/config/supabaseClient.js';
import { sendEmail, fetchReceivedEmail } from '../../utils/emailSender.js';
import { scanLinks, checkTyposquatting, spamFilter } from '../../utils/emailSecurity.js';

// Send email (with attachments)
export async function sendInboxEmail(req, res, next) {
  try {
    const { to, subject, html, body } = req.body;
    // Accept either 'html' or 'body' for message content
    const messageHtml = html || body;
    if (!to || !subject || !messageHtml) {
      return res.status(400).json({ success: false, message: 'Missing to, subject, or message content.' });
    }
    let attachments = [];
    // Build public URLs for attachments for Resend
    if (req.files && Array.isArray(req.files)) {
      const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
      attachments = req.files.map((file) => ({
        filename: file.originalname,
        path: `${BASE_URL}/uploads/${file.filename}`,
        mimetype: file.mimetype,
      }));
    }
    // Send via Resend
    let result;
    try {
      result = await sendEmail({ to, subject, html: messageHtml, attachments });
    } catch (err) {
      console.error('[sendInboxEmail] Resend error:', err);
      return res.status(500).json({ success: false, message: 'Failed to send email', error: err.message });
    }
    // Log to messages table
    const supabase = getSupabase();
    let receiverType = to.endsWith('student.mksu.ac.ke') ? 'student' : 'lecturer';
    let receiverId = null;
    if (receiverType === 'student') {
      // Find student by email
      const { data: student, error: studentErr } = await supabase.from('students').select('id').eq('email', to).maybeSingle();
      if (studentErr) {
        console.error('[sendInboxEmail] Student lookup error:', studentErr);
      }
      if (student && student.id) receiverId = student.id;
    } else {
      // Find lecturer by institutional_email or (optionally) by other email fields
      const { data: lecturer, error: lecturerErr } = await supabase.from('lecturers').select('id').eq('institutional_email', to).maybeSingle();
      if (lecturerErr) {
        console.error('[sendInboxEmail] Lecturer lookup error:', lecturerErr);
      }
      if (lecturer && lecturer.id) receiverId = lecturer.id;
    }
    if (!receiverId) {
      console.error('[sendInboxEmail] No receiver found for email:', to);
      return res.status(422).json({ success: false, message: 'Receiver not found in system.' });
    }
    const { data: message, error } = await supabase.from('messages').insert({
      sender_type: req.user.role,
      sender_id: req.user.id,
      receiver_type: receiverType,
      receiver_id: receiverId,
      subject,
      body: messageHtml,
      is_spam: false,
      link_scan_result: null,
      created_at: new Date().toISOString()
    }).select('*').single();
    if (error) {
      console.error('[sendInboxEmail] DB insert error:', error);
      return res.status(500).json({ success: false, message: 'Failed to save message in database', error: error.message });
    }
    // Save attachments in message_attachments if needed
    if (attachments.length && message) {
      await Promise.all(attachments.map(att =>
        supabase.from('message_attachments').insert({
          message_id: message.id,
          file_path: att.path,
          mime_type: att.mimetype,
          name: att.filename
        })
      ));
    }
    // --- Notification logic ---
    if (receiverType === 'student' && receiverId) {
      await supabase.from('notifications').insert({
        student_id: receiverId,
        resource_id: null,
        type: 'inbox_message',
        title: `New message from ${req.user.role === 'lecturer' ? 'Lecturer' : 'Student'}: ${subject}`
      });
    }
    if (receiverType === 'lecturer' && receiverId) {
      await supabase.from('lecturer_notifications').insert({
        lecturer_id: receiverId,
        resource_id: null,
        type: 'inbox_message',
        title: `New message from ${req.user.role === 'student' ? 'Student' : 'Lecturer'}: ${subject}`
      });
    }
    // --- End notification logic ---
    res.json({ success: true, result });
  } catch (e) {
    console.error('[sendInboxEmail] Unexpected error:', e);
    next(e);
  }
}

// Webhook listener for inbound email
export async function receiveEmailWebhook(req, res, next) {
  try {
    const { email_id } = req.body;
    const email = await fetchReceivedEmail(email_id);
    // Security checks
    const suspiciousLinks = scanLinks(email.html);
    const senderDomain = email.from.split('@')[1];
    const isTyposquatting = checkTyposquatting(senderDomain);
    const spamResult = spamFilter(email);
    let security_status = 'Clean';
    if (isTyposquatting) security_status = 'Malicious';
    else if (suspiciousLinks.length > 0 || spamResult.isSpam) security_status = 'Suspicious';
    // Save to messages table
    const supabase = getSupabase();
    await supabase.from('messages').insert({
      sender_type: email.from.endsWith('student.mksu.ac.ke') ? 'student' : 'lecturer',
      // Only emails ending with @student.mksu.ac.ke are students, all others are lecturers
      sender_id: null, // Lookup by email if needed
      receiver_type: email.to.endsWith('student.mksu.ac.ke') ? 'student' : 'lecturer',
      receiver_id: null, // Lookup by email if needed
      subject: email.subject,
      body: email.html,
      folder: security_status === 'Suspicious' ? 'spam' : 'inbox',
      security_status,
      created_at: new Date().toISOString()
    });
    // Save attachments in message_attachments if needed
    res.status(200).json({ success: true });
  } catch (e) {
    next(e);
  }
}

// List inbox messages
export async function listInbox(req, res, next) {
  try {
    const supabase = getSupabase();
    let query = supabase.from('messages').select('*').eq('receiver_id', req.user.id);
    const { search, filter, unread, date } = req.query;
    if (search) {
      query = query.ilike('subject', `%${search}%`).or(`body.ilike.%${search}%`);
    }
    if (filter) {
      // Example: filter by sender
      query = query.eq('from', filter);
    }
    if (unread === 'true') {
      query = query.eq('read', false);
    }
    if (date) {
      query = query.gte('created_at', date);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

// List sent messages
export async function listSent(req, res, next) {
  try {
    const supabase = getSupabase();
    let query = supabase.from('messages').select('*').eq('sender_id', req.user.id);
    const { search, filter, date } = req.query;
    if (search) {
      query = query.ilike('subject', `%${search}%`).or(`body.ilike.%${search}%`);
    }
    if (filter) {
      query = query.eq('to', filter);
    }
    if (date) {
      query = query.gte('created_at', date);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

// List spam messages
export async function listSpam(req, res, next) {
  try {
    const supabase = getSupabase();
    let query = supabase.from('messages').select('*').eq('receiver_id', req.user.id).eq('is_spam', true);
    const { search, filter, date } = req.query;
    if (search) {
      query = query.ilike('subject', `%${search}%`).or(`body.ilike.%${search}%`);
    }
    if (filter) {
      query = query.eq('from', filter);
    }
    if (date) {
      query = query.gte('created_at', date);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

// Get all lecturers teaching the student
export async function getLecturersForStudent(req, res, next) {
  try {
    const supabase = getSupabase();
    // 1. Get all unit_ids the student is registered for
    const { data: regs, error: regErr } = await supabase
      .from('student_unit_registrations')
      .select('unit_id')
      .eq('student_id', req.user.id);
    if (regErr) throw regErr;
    const unitIds = regs.map(r => r.unit_id);
    if (!unitIds.length) return res.json({ success: true, data: [] });
    // 2. Get all lecturer_ids for those units
    const { data: assigns, error: assignErr } = await supabase
      .from('lecturer_unit_assignments')
      .select('lecturer_id, unit_id')
      .in('unit_id', unitIds);
    if (assignErr) throw assignErr;
    const lecturerIds = [...new Set(assigns.map(a => a.lecturer_id))];
    if (!lecturerIds.length) return res.json({ success: true, data: [] });
    // 3. Get lecturer profiles
    const { data: lecturers, error: lecErr } = await supabase
      .from('lecturers')
      .select('id, full_name, institutional_email')
      .in('id', lecturerIds);
    if (lecErr) throw lecErr;
    res.json({ success: true, data: lecturers });
  } catch (e) {
    next(e);
  }
}

// Get all students for a lecturer's unit
export async function getStudentsForUnit(req, res, next) {
  try {
    const supabase = getSupabase();
    const { unitId } = req.params;
    // 1. Get all student_ids registered for this unit
    const { data: regs, error: regErr } = await supabase
      .from('student_unit_registrations')
      .select('student_id')
      .eq('unit_id', unitId);
    if (regErr) throw regErr;
    const studentIds = regs.map(r => r.student_id);
    if (!studentIds.length) return res.json({ success: true, data: [] });
    // 2. Get student profiles
    const { data: students, error: stuErr } = await supabase
      .from('students')
      .select('id, fullname, email')
      .in('id', studentIds);
    if (stuErr) throw stuErr;
    res.json({ success: true, data: students });
  } catch (e) {
    next(e);
  }
}
