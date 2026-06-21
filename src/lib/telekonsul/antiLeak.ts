// Anti-leak filter — detect contact info in messages
// Block sharing email/phone/social handles to prevent off-platform escape

const LEAK_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "email", regex: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/i },
  { name: "wa-link", regex: /(wa\.me|whatsapp\.com|chat\.whatsapp)/i },
  { name: "telegram", regex: /(t\.me|telegram\.me|telegram\.org)/i },
  { name: "phone-id", regex: /\b0[0-9]{9,12}\b/ },
  { name: "phone-intl", regex: /\+62[\s-]?[0-9]{8,13}\b/ },
  { name: "instagram-url", regex: /instagram\.com\//i },
  { name: "twitter-url", regex: /(twitter|x)\.com\//i },
  { name: "tiktok-url", regex: /tiktok\.com\//i },
  { name: "ig-handle", regex: /\bIG[:@\s][a-z0-9_.]{3,30}\b/i },
];

export function detectContactLeak(text: string): { found: boolean; matches: string[] } {
  const matches: string[] = [];
  for (const { name, regex } of LEAK_PATTERNS) {
    if (regex.test(text)) matches.push(name);
  }
  return { found: matches.length > 0, matches };
}
