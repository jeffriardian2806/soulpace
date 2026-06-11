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
  "Skrining ini alat bantu untuk mengenali gejala, BUKAN diagnosis. Hasilnya tidak menggantikan pemeriksaan oleh psikolog atau psikiater. Kalau ragu atau merasa berat, temui profesional.";
