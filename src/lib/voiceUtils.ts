/**
 * Convert phone number ke format yang readable buat TTS Indonesian.
 * Mencegah "1500-567" dibaca sebagai "seribu lima ratus sampai lima ratus enam puluh tujuh".
 * 
 * Output: digit-by-digit dengan space — "1 5 0 0 5 6 7"
 * "ext" diganti jadi "ekstensi"
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
