// Kosakata Mood & Wishes (sumber tunggal).
// Dipakai di mood check-in, compose curhat, badge PostCard, dan filter.

export interface MoodOption {
  slug: string;
  label: string;
  emoji: string;
}

// ~12 mood, spektrum positif → netral → berat (sesuai konteks mental health).
export const MOODS: MoodOption[] = [
  { slug: "senang", label: "Senang", emoji: "😊" },
  { slug: "bersyukur", label: "Bersyukur", emoji: "🙏" },
  { slug: "tenang", label: "Tenang", emoji: "😌" },
  { slug: "biasa", label: "Biasa aja", emoji: "😐" },
  { slug: "lelah", label: "Lelah", emoji: "😮‍💨" },
  { slug: "hampa", label: "Kosong", emoji: "🫥" },
  { slug: "sedih", label: "Sedih", emoji: "😢" },
  { slug: "cemas", label: "Cemas", emoji: "😰" },
  { slug: "kesepian", label: "Kesepian", emoji: "🥺" },
  { slug: "bingung", label: "Bingung", emoji: "😕" },
  { slug: "marah", label: "Marah", emoji: "😣" },
  { slug: "kewalahan", label: "Kewalahan", emoji: "🤯" },
];

// ~6 wishes — apa yang dibutuhin dari orang lain saat posting.
export const WISHES: MoodOption[] = [
  { slug: "didengar", label: "Butuh Didengar", emoji: "🗣️" },
  { slug: "peluk", label: "Butuh Peluk", emoji: "🤗" },
  { slug: "saran", label: "Butuh Saran", emoji: "💡" },
  { slug: "semangat", label: "Butuh Disemangati", emoji: "💪" },
  { slug: "yakin", label: "Butuh Diyakinkan", emoji: "🌱" },
  { slug: "cerita", label: "Cuma Mau Cerita", emoji: "📝" },
];

const moodMap = new Map(MOODS.map((m) => [m.slug, m]));
const wishMap = new Map(WISHES.map((w) => [w.slug, w]));

export function getMood(slug: string | null | undefined): MoodOption | null {
  return slug ? moodMap.get(slug) ?? null : null;
}
export function getWish(slug: string | null | undefined): MoodOption | null {
  return slug ? wishMap.get(slug) ?? null : null;
}
