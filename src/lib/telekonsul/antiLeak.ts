// Anti-leak filter — detect contact info / off-platform escape attempts.
// Pendekatan agresif: orang share kontak pakai bahasa natural, singkatan,
// eja angka, plesetan. Bukan cuma format teknis (URL/digit).

// ── Spelled digits (eja angka) → digit ────────────────────────────
const SPELLED_DIGITS: Record<string, string> = {
  nol: "0", kosong: "0", ow: "0", o: "0",
  satu: "1", se: "1",
  dua: "2", duo: "2",
  tiga: "3",
  empat: "4", pat: "4",
  lima: "5",
  enam: "6", nem: "6",
  tujuh: "7",
  delapan: "8", lapan: "8",
  sembilan: "9", bilan: "9",
};

function spelledNumbersToDigits(text: string): string {
  const words = text.toLowerCase().split(/[\s,.\-_]+/);
  let buffer = "";
  let result = "";
  for (const w of words) {
    if (SPELLED_DIGITS[w] !== undefined) {
      buffer += SPELLED_DIGITS[w];
    } else {
      if (buffer) {
        result += " " + buffer + " ";
        buffer = "";
      }
      result += w + " ";
    }
  }
  if (buffer) result += " " + buffer;
  return result;
}

// ── Platform names + singkatan + plesetan ─────────────────────────
// Termasuk semua singkatan umum Indonesia (FB, IG, WA, TW, dll)
const PLATFORM_WORDS = [
  // Instagram
  "instagram", "ig", "insta", "instagrm", "igku", "igdong",
  // Facebook
  "facebook", "fb", "fesbuk", "pesbuk", "pb", "fbku",
  // Twitter / X
  "twitter", "twiter", "tw", "twt", "tweet", "twitt",
  // LinkedIn
  "linkedin", "linkdin", "linked", "lnkd",
  // TikTok
  "tiktok", "tt", "tikok",
  // Telegram
  "telegram", "tele", "tg", "telgram", "telega",
  // WhatsApp
  "whatsapp", "wa", "watsap", "wasap", "wasab", "whatsappa", "watsapp", "hapsap", "whatsap", "wap",
  // Line
  "line", "lineku",
  // Snapchat
  "snapchat", "snap", "sc",
  // Discord
  "discord", "disc", "dc",
  // Signal
  "signal",
  // Email
  "email", "e-mail", "mail", "gmail", "yahoo", "hotmail", "outlook", "proton", "icloud", "surel", "imel",
  // YouTube
  "youtube", "yt", "ytb",
  // Phone generic
  "hp", "handphone", "hape", "henpon", "telpon", "telepon", "tlp", "telp", "phone", "nomor", "nomer", "nope", "kontak", "kontek",
];

// ── Sharing-context cues ──────────────────────────────────────────
// Kata yang nunjukin niat share/exchange identitas atau kontak
const SHARING_CONTEXT = /(saya|sy|aku|ak|gw|gue|gua|w|punya|akun|account|username|user|usernya|add|add\s?me|follow|folow|cari|search|hubungi|hubungin|kontak|kontek|dm|chat|message|pesan|nomor|nomer|nope|no\b|number|id\b|namanya|nama|japri|jalur\s?pribadi|jp\b|pin|invite|undang|tambah|tambahin|save|simpan|ketik|nick|nickname|handle|panggil)/i;

const LEAK_PATTERNS: { name: string; regex: RegExp }[] = [
  // Email (format @)
  { name: "email", regex: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/i },
  // Email diucap ("jeff at gmail", "jeff (at) gmail dot com")
  { name: "email-spoken", regex: /\b[\w.]+\s*\(?\s*(at|@)\s*\)?\s*(gmail|yahoo|hotmail|outlook|proton|icloud)\b/i },
  // Domain dot com diucap
  { name: "domain-spoken", regex: /\b(gmail|yahoo|hotmail|outlook|proton|icloud)\s*(dot|titik|\.)\s*(com|co|id|net)\b/i },
  // Chat app links
  { name: "wa-link", regex: /(wa\.me|whatsapp\.com|chat\.whatsapp|api\.whatsapp)/i },
  { name: "telegram-link", regex: /(t\.me|telegram\.me|telegram\.org)/i },
  // Social URLs (semua platform)
  { name: "social-url", regex: /(instagram|facebook|fb|twitter|x|tiktok|linkedin|youtube|youtu|snapchat|discord)\.(com|be|gg|me)\b/i },
  // Phone (digit form, setelah normalisasi spelled→digit juga kena ini)
  { name: "phone-id", regex: /\b0\s?8[\d\s.\-]{7,15}\b/ },
  { name: "phone-intl", regex: /\+?62\s?8[\d\s.\-]{7,15}\b/ },
  // Sequence digit panjang (8+ digit) — kemungkinan no HP walau format aneh
  { name: "long-digits", regex: /\d[\d\s.\-]{7,}\d/ },
];

// Build platform regex sekali (escape + word boundary)
const PLATFORM_REGEXES = PLATFORM_WORDS.map((p) => ({
  word: p,
  re: new RegExp(`(^|[^a-z0-9])${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i"),
}));

function detectPlatformSharing(text: string): boolean {
  const lower = text.toLowerCase();
  const hasSharingContext = SHARING_CONTEXT.test(lower);
  // Token "konten" = kata yang bukan platform & bukan kata fungsi.
  // Kalau platform disebut + ada indikasi share (context/username/digit/@/handle), block.
  for (const { word, re } of PLATFORM_REGEXES) {
    if (!re.test(lower)) continue;

    // 1. Ada konteks sharing eksplisit
    if (hasSharingContext) return true;

    // 2. Ada digit di mana pun (no HP / id numerik)
    if (/\d/.test(lower)) return true;

    // 3. Ada @ handle atau # tag
    if (/[@#]/.test(text)) return true;

    // 4. Ada token username-like SETELAH platform word (3+ alnum, bukan kata fungsi umum)
    //    Pisah teks pakai platform word sebagai delimiter, ambil sisa setelahnya.
    const idx = lower.indexOf(word);
    if (idx >= 0) {
      const after = lower.slice(idx + word.length).replace(/^[\s:.\-_=]+/, "");
      const firstToken = after.split(/[\s,.]+/)[0] ?? "";
      const STOPWORDS = new Set(["dong","aja","ya","sih","nih","deh","kok","gak","ga","engga","nggak","atau","sama","juga","dan","yang","itu","ini","punya","ku","mu"]);
      if (/^[a-z0-9_.]{3,30}$/.test(firstToken) && !STOPWORDS.has(firstToken)) {
        return true;
      }
      // token "ku"/"mu" nempel (tiktok ku jeffriardian) → cek token kedua
      const secondToken = after.split(/[\s,.]+/)[1] ?? "";
      if ((firstToken === "ku" || firstToken === "mu" || firstToken === "gw" || firstToken === "gua") &&
          /^[a-z0-9_.]{3,30}$/.test(secondToken) && !STOPWORDS.has(secondToken)) {
        return true;
      }
    }
  }
  return false;
}

export function detectContactLeak(text: string): { found: boolean; matches: string[] } {
  const matches: string[] = [];

  const normalized = spelledNumbersToDigits(text);
  const combinedText = text + " " + normalized;

  for (const { name, regex } of LEAK_PATTERNS) {
    if (regex.test(combinedText)) matches.push(name);
  }

  if (detectPlatformSharing(text)) {
    matches.push("platform-sharing");
  }

  // Standalone: ajakan pindah jalur ("japri", "jalur pribadi", "lanjut di luar") + ada angka/kontak hint
  if (/\b(japri|jalur\s?pribadi|jp)\b/i.test(text) && /\d/.test(text)) {
    matches.push("japri-leak");
  }

  return { found: matches.length > 0, matches: Array.from(new Set(matches)) };
}

// ── Dynamic blocklist (admin-managed) + hardcode fallback ─────────
// Double protection: kalau DB error/kosong, hardcode tetap jalan.
type BlocklistEntry = { pattern: string; match_type: "keyword" | "contains" | "regex" };

function matchBlocklistEntry(text: string, entry: BlocklistEntry): boolean {
  const lower = text.toLowerCase();
  const p = entry.pattern.toLowerCase();
  try {
    if (entry.match_type === "keyword") {
      const re = new RegExp(
        `(^|[^a-z0-9])${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`,
        "i"
      );
      return re.test(lower);
    }
    if (entry.match_type === "contains") {
      return lower.includes(p);
    }
    if (entry.match_type === "regex") {
      return new RegExp(entry.pattern, "i").test(text);
    }
  } catch {
    return false; // regex invalid → skip, jangan crash
  }
  return false;
}

// Async: cek hardcode DULU (fallback selalu jalan), lalu dynamic blocklist.
// blocklist di-pass dari caller (server action fetch dari DB).
export function detectContactLeakCombined(
  text: string,
  blocklist: BlocklistEntry[]
): { found: boolean; matches: string[] } {
  // 1. Hardcode (selalu jalan, fallback)
  const hard = detectContactLeak(text);
  const matches = [...hard.matches];

  // 2. Dynamic blocklist (admin-managed, lapisan tambahan)
  // Cek juga versi normalized (eja-angka→digit) buat keyword/contains
  const normalized = spelledNumbersToDigits(text);
  for (const entry of blocklist) {
    if (matchBlocklistEntry(text, entry) || matchBlocklistEntry(normalized, entry)) {
      matches.push(`blocklist:${entry.pattern}`);
    }
  }

  return { found: matches.length > 0, matches: Array.from(new Set(matches)) };
}
