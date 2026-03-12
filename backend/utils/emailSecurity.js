import levenshteinPkg from 'fast-levenshtein';
const { get: levenshtein } = levenshteinPkg;
import * as cheerio from 'cheerio';

export function scanLinks(html) {
  const $ = cheerio.load(html);
  const suspiciousLinks = [];
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    const text = $(el).text();
    if (href && text && href !== text && !href.includes(text)) {
      suspiciousLinks.push({ href, text });
    }
    // Add more domain checks as needed
  });
  return suspiciousLinks;
}

export function checkTyposquatting(senderDomain) {
  const officialDomains = ['mksu.ac.ke', 'student.mksu.ac.ke'];
  return officialDomains.some(domain =>
    levenshtein.get(senderDomain, domain) <= 2
  );
}

export function spamFilter(email) {
  const spamKeywords = ['win', 'free', 'urgent', 'click', 'prize', 'money', 'offer'];
  const body = email.html || email.text || '';
  const found = spamKeywords.some(word => body.toLowerCase().includes(word));
  const passedSPF = email.headers?.spf === 'pass';
  const passedDKIM = email.headers?.dkim === 'pass';
  return {
    isSpam: found || !passedSPF || !passedDKIM,
    foundKeywords: found ? spamKeywords.filter(word => body.toLowerCase().includes(word)) : []
  };
}
