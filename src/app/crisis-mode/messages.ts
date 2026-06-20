import { createClient } from "@/lib/supabase/server";

export type CrisisMessages = {
  phase_opening: string;
  phase_means_check: string;
  phase_means_restrict: string;
  phase_connection_intro: string;
  phase_done_encouragement: string;
  companion_gentle: string[]; // multiple, rotate every 40s
};

// Default fallback kalau table belum di-seed atau gagal fetch
const DEFAULTS: CrisisMessages = {
  phase_opening: "Gw di sini sama lo. Tarik napas pelan. Lo aman.",
  phase_means_check: "Sebelum lanjut. Ada benda yang bisa nyakitin lo deket sekarang?",
  phase_means_restrict: "Coba pindahin dulu. Pindahin ke ruangan lain, atau kasih ke orang. Gw nunggu.",
  phase_connection_intro: "Konek ke manusia dulu. Suara orang lebih kuat dari teks.",
  phase_done_encouragement: "Lo udah lewatin moment ini. Yang berat tadi udah lewat. Lo masih ada. Itu pekerjaan paling penting hari ini.",
  companion_gentle: [
    "Gw masih di sini sama lo.",
    "Nafas. Pelan aja.",
    "Lo bertahan. Itu lebih dari cukup.",
    "Ga harus ngapa-ngapain. Cukup ada.",
    "Setiap detik lewat itu kemenangan.",
    "Lo aman sekarang.",
    "Mind lo lagi alarm. Tubuh lo aman.",
    "Yang lo rasain valid. Yang lo butuh valid.",
  ],
};

export async function getCrisisMessages(): Promise<CrisisMessages> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("crisis_mode_messages")
    .select("slot, text, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  if (!data || data.length === 0) return DEFAULTS;

  const rows = data as { slot: string; text: string; sort_order: number }[];

  const single = (slot: string) => rows.find((r) => r.slot === slot)?.text ?? DEFAULTS[slot as keyof CrisisMessages] as string;
  const multi = (slot: string) => {
    const items = rows.filter((r) => r.slot === slot).map((r) => r.text);
    return items.length > 0 ? items : DEFAULTS.companion_gentle;
  };

  return {
    phase_opening: single("phase_opening"),
    phase_means_check: single("phase_means_check"),
    phase_means_restrict: single("phase_means_restrict"),
    phase_connection_intro: single("phase_connection_intro"),
    phase_done_encouragement: single("phase_done_encouragement"),
    companion_gentle: multi("companion_gentle"),
  };
}
