const QUOTES = [
  "Di depan badai akan segera berlalu. Kamu lebih kuat dari yang kamu kira.",
  "Kamu nggak sendirian. Hari ini, cukup bertahan saja sudah cukup.",
  "Setiap hari yang kamu lewati adalah bukti kekuatanmu.",
  "Boleh capek, boleh nangis. Tapi jangan menyerah.",
  "Hidupmu berharga, bahkan di hari yang paling berat.",
  "Pelan-pelan nggak apa-apa. Yang penting kamu nggak berhenti.",
  "Badai paling besar pun pada akhirnya reda.",
];

// Deterministik per hari: quote sama sepanjang hari, ganti tiap hari.
export function getDailyQuote(): string {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
}
