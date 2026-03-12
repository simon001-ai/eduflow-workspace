import { authorizeGmail, listUnreadReplies, getMessage } from './gmailClient.js';
import { processGmailReply } from './processGmailReply.js';

export async function pollGmailReplies() {
  try {
    const auth = await authorizeGmail();
    const messages = await listUnreadReplies(auth, 'is:unread');
    for (const msg of messages) {
      const fullMsg = await getMessage(auth, msg.id);
      // Parse reply details
      const from = fullMsg.payload.headers.find(h => h.name === 'From')?.value;
      const subject = fullMsg.payload.headers.find(h => h.name === 'Subject')?.value;
      const threadId = fullMsg.threadId;
      // Extract body (simple text)
      let body = fullMsg.snippet;
      if (fullMsg.payload.parts && fullMsg.payload.parts.length) {
        const part = fullMsg.payload.parts.find(p => p.mimeType === 'text/plain');
        if (part && part.body && part.body.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf8');
        }
      }
      // Store reply and notify
      await processGmailReply({ from, subject, body, threadId });
    }
  } catch (err) {
    console.error('Gmail polling error:', err);
  }
}

// Example usage: poll every 5 minutes
// setInterval(pollGmailReplies, 5 * 60 * 1000);
