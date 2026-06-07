// Logic insight untuk This-or-That. KONTEN sekarang di DB.
export function thisOrThatInsight(bCount: number, total: number): string {
  const ratio = total ? bCount / total : 0.5;
  if (ratio >= 0.6) return "Malam ini kamu tampaknya lebih butuh ruang & ketenangan daripada solusi cepat. Ga apa-apa pelan-pelan.";
  if (ratio <= 0.4) return "Malam ini kamu kayaknya lebih butuh kehadiran & koneksi. Boleh kok cari orang buat ditemenin.";
  return "Kamu lagi di tengah-tengah — butuh ditemani sekaligus diberi ruang. Dengerin dirimu pelan-pelan.";
}
