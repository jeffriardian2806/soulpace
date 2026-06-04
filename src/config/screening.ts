// Konfigurasi skrining (STATIS untuk sekarang).
// Struktur ini sengaja dibikin data-driven: nanti tinggal ganti sumbernya
// jadi fetch dari Supabase (bentuk datanya sama) biar psikolog bisa nambah/ubah
// pertanyaan & skor tanpa sentuh kode UI.

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
  items: string[];
  bands: ScreeningBand[];
  // index item (0-based) yang memicu peringatan krisis bila dijawab > 0
  crisisItemIndex?: number;
};

export const SCREENING_DISCLAIMER =
  "Skrining ini alat bantu untuk mengenali gejala, BUKAN diagnosis. Hasilnya tidak menggantikan pemeriksaan oleh psikolog atau psikiater. Kalau ragu atau merasa berat, temui profesional.";

const OPTIONS: ScreeningOption[] = [
  { label: "Tidak pernah", value: 0 },
  { label: "Beberapa hari", value: 1 },
  { label: "Lebih dari separuh hari", value: 2 },
  { label: "Hampir setiap hari", value: 3 },
];

const PHQ9: ScreeningInstrument = {
  id: "phq9",
  name: "PHQ-9",
  subtitle: "Gejala depresi",
  prompt:
    "Selama 2 minggu terakhir, seberapa sering kamu terganggu oleh hal-hal berikut?",
  options: OPTIONS,
  items: [
    "Kurang berminat atau bergairah dalam melakukan apa pun.",
    "Merasa murung, sedih, atau putus asa.",
    "Sulit tidur, sering terbangun, atau tidur terlalu banyak.",
    "Merasa lelah atau kurang berenergi.",
    "Kurang nafsu makan atau makan berlebihan.",
    "Merasa buruk tentang diri sendiri, merasa gagal atau mengecewakan diri/keluarga.",
    "Sulit berkonsentrasi, misalnya saat membaca atau menonton sesuatu.",
    "Bergerak atau bicara sangat lambat sampai orang lain menyadarinya, atau sebaliknya gelisah dan tidak bisa diam.",
    "Muncul pikiran bahwa lebih baik mati atau ingin menyakiti diri sendiri.",
  ],
  crisisItemIndex: 8,
  bands: [
    { min: 0, max: 4, label: "Minimal", advice: "Gejala minimal. Tetap jaga diri dan rutinitas ya." },
    { min: 5, max: 9, label: "Ringan", advice: "Gejala ringan. Coba teknik relaksasi & jaga pola tidur. Kalau menetap, pertimbangkan ngobrol sama profesional." },
    { min: 10, max: 14, label: "Sedang", advice: "Gejala sedang. Disarankan ngobrol sama psikolog/konselor untuk dukungan lebih." },
    { min: 15, max: 19, label: "Sedang-berat", advice: "Gejala cukup berat. Sebaiknya segera cari bantuan profesional." },
    { min: 20, max: 27, label: "Berat", advice: "Gejala berat. Tolong cari bantuan profesional secepatnya. Kamu nggak harus menghadapi ini sendirian." },
  ],
};

const GAD7: ScreeningInstrument = {
  id: "gad7",
  name: "GAD-7",
  subtitle: "Gejala kecemasan",
  prompt:
    "Selama 2 minggu terakhir, seberapa sering kamu terganggu oleh hal-hal berikut?",
  options: OPTIONS,
  items: [
    "Merasa gugup, cemas, atau tegang.",
    "Tidak mampu menghentikan atau mengendalikan rasa khawatir.",
    "Terlalu banyak mengkhawatirkan berbagai hal.",
    "Sulit untuk santai atau rileks.",
    "Merasa gelisah sampai sulit untuk diam.",
    "Mudah kesal atau tersinggung.",
    "Merasa takut seakan ada hal buruk yang akan terjadi.",
  ],
  bands: [
    { min: 0, max: 4, label: "Minimal", advice: "Kecemasan minimal. Tetap jaga diri ya." },
    { min: 5, max: 9, label: "Ringan", advice: "Kecemasan ringan. Teknik napas & grounding bisa bantu. Kalau menetap, pertimbangkan profesional." },
    { min: 10, max: 14, label: "Sedang", advice: "Kecemasan sedang. Disarankan ngobrol sama psikolog/konselor." },
    { min: 15, max: 21, label: "Berat", advice: "Kecemasan berat. Sebaiknya segera cari bantuan profesional." },
  ],
};

export const SCREENING_INSTRUMENTS: ScreeningInstrument[] = [PHQ9, GAD7];
