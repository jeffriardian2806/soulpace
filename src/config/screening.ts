// Tipe skrining + teks disclaimer (statis).
// Data instrumen (PHQ-9/GAD-7/dst) sekarang DINAMIS dari Supabase, dikelola via admin panel.

export type ScreeningOption = { label: string; value: number };
export type ScreeningBand = {
  min: number;
  max: number;
  label: string;
  advice: string;
};
export type ScreeningInstrument = {
  id: string;
  name: string;
  subtitle: string;
  prompt: string;
  options: ScreeningOption[];
  items: { text: string; reverse: boolean }[];
  bands: ScreeningBand[];
  // index item (0-based) yang memicu peringatan krisis bila dijawab > 0
  crisisItemIndex?: number;
};

export const SCREENING_DISCLAIMER =
  "Hasil skrining tidak menggantikan pemeriksaan atau penilaian profesional oleh psikolog maupun psikiater. Jika Anda merasa ragu, mengalami keluhan yang mengganggu, atau merasa kondisi semakin berat, disarankan untuk berkonsultasi dengan tenaga profesional.";
