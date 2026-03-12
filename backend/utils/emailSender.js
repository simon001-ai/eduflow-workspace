import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = 'njoroogu@gmail.com';
const REPLY_TO = 'noreply@eduflow.com';


// Send email via Resend SDK
export async function sendEmail({ to, subject, html, attachments }) {
  const emailPayload = {
    from: FROM_ADDRESS,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    reply_to: REPLY_TO,
  };
  if (attachments && attachments.length) {
    emailPayload.attachments = attachments;
  }
  const { data, error } = await resend.emails.send(emailPayload);
  if (error) {
    throw new Error(error.message || 'Failed to send email');
  }
  return data;
}

// Fetch received email by ID (not supported in SDK, fallback to API if needed)
import axios from 'axios';
export async function fetchReceivedEmail(emailId) {
  const response = await axios.get(
    `https://api.resend.com/emails/${emailId}`,
    { headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` } }
  );
  return response.data;
}
