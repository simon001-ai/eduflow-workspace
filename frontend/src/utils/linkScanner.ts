const KNOWN_SAFE_DOMAINS = [
  "google.com", "github.com", "stackoverflow.com", "wikipedia.org",
  "university.ac.ke", "edu", "ac.ke", "microsoft.com",
];

const TYPOSQUAT_PATTERNS: Record<string, string> = {
  "g00gle": "google", "gogle": "google", "googel": "google",
  "faceb00k": "facebook", "facebok": "facebook",
  "micros0ft": "microsoft", "microsft": "microsoft",
  "amaz0n": "amazon", "amazn": "amazon",
  "paypa1": "paypal", "paypl": "paypal",
};

export interface LinkScanResult {
  url: string;
  isSafe: boolean;
  warnings: string[];
}

export function scanLinks(text: string): LinkScanResult[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const urls = text.match(urlRegex) || [];

  return urls.map((url) => {
    const warnings: string[] = [];

    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      // Check for IP-based URLs
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        warnings.push("URL uses IP address instead of domain name");
      }

      // Check for typosquatting
      for (const [typo, real] of Object.entries(TYPOSQUAT_PATTERNS)) {
        if (hostname.includes(typo)) {
          warnings.push(`Possible typosquatting: "${typo}" looks like "${real}"`);
        }
      }

      // Check for suspicious TLDs
      if (/\.(xyz|top|click|loan|work|gq|ml|cf|tk)$/.test(hostname)) {
        warnings.push("Suspicious top-level domain");
      }

      // Check for excessive subdomains
      if (hostname.split(".").length > 4) {
        warnings.push("Unusually many subdomains");
      }

      // Check for special characters that might be homograph attacks
      if (/[^\x00-\x7F]/.test(hostname)) {
        warnings.push("Contains non-ASCII characters (possible homograph attack)");
      }
    } catch {
      warnings.push("Malformed URL");
    }

    return { url, isSafe: warnings.length === 0, warnings };
  });
}

export function scanEmailForThreats(body: string): {
  hasThreats: boolean;
  results: LinkScanResult[];
} {
  const results = scanLinks(body);
  return {
    hasThreats: results.some((r) => !r.isSafe),
    results,
  };
}
