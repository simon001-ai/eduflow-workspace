const SPAM_KEYWORDS = [
  "you won", "claim your prize", "lottery", "free money",
  "click here now", "act now", "limited time", "congratulations",
  "million dollars", "nigerian prince", "wire transfer",
  "viagra", "casino", "bitcoin doubler",
];

const SUSPICIOUS_DOMAINS = [
  "spam.com", "scam.net", "phishing.org", "malware.xyz",
  "free-money.com", "win-prize.net",
];

export function detectSpam(subject: string, body: string, senderEmail: string): {
  isSpam: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const combined = `${subject} ${body}`.toLowerCase();

  for (const keyword of SPAM_KEYWORDS) {
    if (combined.includes(keyword)) {
      reasons.push(`Contains spam keyword: "${keyword}"`);
    }
  }

  for (const domain of SUSPICIOUS_DOMAINS) {
    if (senderEmail.toLowerCase().includes(domain)) {
      reasons.push(`Sender uses suspicious domain: ${domain}`);
    }
  }

  if (/[A-Z]{5,}/.test(subject)) {
    reasons.push("Excessive capitalization in subject");
  }

  if ((body.match(/!/g) || []).length > 5) {
    reasons.push("Excessive exclamation marks");
  }

  return { isSpam: reasons.length >= 2, reasons };
}
