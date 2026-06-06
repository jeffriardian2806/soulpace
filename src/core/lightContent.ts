// This-or-That (#9) + Empathy Challenge harian (#8) — statis, tanpa DB, tanpa streak.
export const THIS_OR_THAT: { a: string; b: string }[] = [
  { a: "Ditemani", b: "Diberi ruang" },
  { a: "Butuh dijelaskan", b: "Butuh ditenangkan" },
  { a: "Pengen dipeluk", b: "Pengen didengar" },
  { a: "Istirahat dulu", b: "Selesaikan dulu" },
  { a: "Cerita ke orang", b: "Tulis sendiri" },
  { a: "Solusi cepat", b: "Koneksi yang aman" },
  { a: "Sendiri tapi tenang", b: "Rame tapi ga sendiri" },
];
export function thisOrThatInsight(bCount: number, total: number): string {
  const ratio = total ? bCount / total : 0.5;
  if (ratio >= 0.6) return "Malam ini kamu tampaknya lebih butuh ruang & ketenangan daripada solusi cepat. Ga apa-apa pelan-pelan.";
  if (ratio <= 0.4) return "Malam ini kamu kayaknya lebih butuh kehadiran & koneksi. Boleh kok cari orang buat ditemenin.";
  return "Kamu lagi di tengah-tengah — butuh ditemani sekaligus diberi ruang. Dengerin dirimu pelan-pelan.";
}

export const EMPATHY_CHALLENGES: string[] = [
  "Hari ini, cari 1 curhat yang belum dibalas dan tinggalin balasan yang menenangkan.",
  "Hari ini, balas tanpa ngasih nasihat dulu — cukup validasi perasaannya.",
  "Hari ini, baca satu Cerita panjang dan kirim Peluk.",
  "Hari ini, kirim satu kalimat hangat ke orang yang lagi 'Butuh Didengar'.",
  "Hari ini, tahan diri buat ga ngehakimi, walau ga setuju.",
];
export function challengeOfTheDay(): string {
  const day = Math.floor(Date.now() / 86400000);
  return EMPATHY_CHALLENGES[day % EMPATHY_CHALLENGES.length];
}

export const QUEST_PROMPTS: string[] = [
  "Aku biasanya pura-pura kuat saat...",
  "Aku paling butuh didengar ketika...",
  "Batasan yang ingin kupelajari...",
  "Pola relasi yang sering kuulang...",
  "Cara tubuhku ngasih tanda capek...",
  "Satu hal yang ingin kulepaskan...",
  "Surat singkat untuk diriku yang masih bertahan...",
];
