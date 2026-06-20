/**
 * Convert phone number ke format yang readable buat TTS Indonesian.
 * Mencegah "1500-567" dibaca sebagai "seribu lima ratus sampai lima ratus enam puluh tujuh".
 * Output: digit-by-digit dengan space — "1 5 0 0 5 6 7"
 */
export function spellPhoneForTTS(phone: string): string {
  return phone
    .replace(/ext\.?/gi, "ekstensi")
    .replace(/[^0-9a-zA-Z\s]/g, " ")
    .split("")
    .map((c) => (/\d/.test(c) ? `${c} ` : c))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pre-process text buat TTS Indonesian biar slang internet ke-baca natural.
 * Bug: "gw" dibaca "ge-we" → fix replace ke "gue".
 * Plus beberapa slang umum lain biar TTS engine ga literal baca abbreviations.
 */
export function humanizeForTTS(text: string): string {
  return text
    .replace(/\bgw\b/gi, "gue")
    .replace(/\byg\b/gi, "yang")
    .replace(/\budh\b/gi, "udah")
    .replace(/\bklo\b/gi, "kalo")
    .replace(/\bblm\b/gi, "belum")
    .replace(/\bkrn\b/gi, "karena")
    .replace(/\btdk\b/gi, "tidak")
    .replace(/\btrs\b/gi, "terus")
    .replace(/\bdmn\b/gi, "dimana")
    .replace(/\bdri\b/gi, "dari")
    .replace(/\bsmpe\b/gi, "sampai")
    .replace(/\bmsh\b/gi, "masih")
    .replace(/\bgt\b/gi, "gitu")
    .replace(/\bsm\b/gi, "sama");
}
