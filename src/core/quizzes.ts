// Kuis reflektif statis (BUKAN diagnosis). Scoring: tally tipe, hasil = tipe terbanyak.
export interface QuizOption { label: string; type: string }
export interface QuizQuestion { text: string; options: QuizOption[] }
export interface QuizResult { label: string; desc: string }
export interface Quiz {
  key: string;
  title: string;
  emoji: string;
  intro: string;
  questions: QuizQuestion[];
  results: Record<string, QuizResult>;
  // map tipe hasil -> wish slug (buat kuis needs), opsional
  wishOf?: Record<string, string>;
}

export const QUIZZES: Quiz[] = [
  {
    key: "needs",
    title: "Sebenernya Aku Butuh Apa?",
    emoji: "🫶",
    intro: "Kadang kita sedih atau marah tapi bingung butuhnya apa. Yuk dikira-kira.",
    questions: [
      { text: "Pas lagi berat, yang paling bikin lega biasanya...", options: [
        { label: "Ada yang mau dengerin", type: "didengar" },
        { label: "Dipeluk / ditemenin", type: "peluk" },
        { label: "Dikasih jalan keluar", type: "saran" },
        { label: "Diyakinin semua bakal oke", type: "yakin" },
      ]},
      { text: "Yang paling bikin kesel kalau lagi cerita ke orang...", options: [
        { label: "Dipotong sama nasihat", type: "didengar" },
        { label: "Ditinggal sendirian", type: "peluk" },
        { label: "Cuma dikasihani tanpa solusi", type: "saran" },
        { label: "Diremehin perasaannya", type: "yakin" },
      ]},
      { text: "Malam-malam pas susah tidur, kamu pengen...", options: [
        { label: "Ngobrol sama seseorang", type: "didengar" },
        { label: "Ada yang nemenin diam-diam", type: "peluk" },
        { label: "Tahu langkah besok apa", type: "saran" },
        { label: "Denger 'kamu udah cukup'", type: "yakin" },
      ]},
      { text: "Kalau lagi ragu sama diri sendiri...", options: [
        { label: "Pengen didengerin dulu", type: "didengar" },
        { label: "Pengen dirangkul", type: "peluk" },
        { label: "Pengen arahan konkret", type: "saran" },
        { label: "Pengen ditenangin", type: "yakin" },
      ]},
      { text: "Setelah hari yang melelahkan, yang paling kamu cari...", options: [
        { label: "Tempat buat ngomong", type: "didengar" },
        { label: "Kehangatan", type: "peluk" },
        { label: "Rencana biar besok lebih ringan", type: "saran" },
        { label: "Kepastian kamu ga sendirian", type: "yakin" },
      ]},
    ],
    results: {
      didengar: { label: "Butuh Didengar", desc: "Kamu lagi butuh ruang buat ngomong tanpa dihakimi. Bukan minta dikasihani, cuma pengen ada yang beneran nyimak." },
      peluk: { label: "Butuh Peluk / Ditemani", desc: "Kamu lagi butuh kehangatan dan ditemenin. Kadang kehadiran lebih nyembuhin dari kata-kata." },
      saran: { label: "Butuh Saran", desc: "Kamu lagi nyari pegangan dan arah. Wajar pengen langkah yang lebih jelas." },
      yakin: { label: "Butuh Diyakinkan", desc: "Kamu lagi butuh ketenangan dan kepastian. Bukan manja, cuma kebanyakan di situasi abu-abu." },
    },
    wishOf: { didengar: "didengar", peluk: "peluk", saran: "saran", yakin: "yakin" },
  },
  {
    key: "stress",
    title: "Karakter Aku Saat Tertekan",
    emoji: "🌀",
    intro: "Karakter orang sering beda pas normal vs pas stres. Ini cuma pola, bukan label permanen.",
    questions: [
      { text: "Pas lagi banyak tekanan, kamu cenderung...", options: [
        { label: "Menghindar / kabur", type: "avoid" },
        { label: "Diam dan nahan sendiri", type: "tahan" },
        { label: "Gampang meledak", type: "ledak" },
        { label: "Sibuk nolongin orang lain", type: "nolong" },
      ]},
      { text: "Kalau masalah numpuk, refleks pertamamu...", options: [
        { label: "Nunda dan main hp", type: "avoid" },
        { label: "Senyum padahal ga baik-baik aja", type: "tahan" },
        { label: "Jadi sensian", type: "ledak" },
        { label: "Mikirin masalah orang dulu", type: "nolong" },
      ]},
      { text: "Orang lain biasanya ngeliat kamu pas stres sebagai...", options: [
        { label: "Yang ngilang tiba-tiba", type: "avoid" },
        { label: "Yang kuat banget", type: "tahan" },
        { label: "Yang lagi 'panas'", type: "ledak" },
        { label: "Yang selalu sibuk ngurus orang", type: "nolong" },
      ]},
      { text: "Yang paling susah kamu lakuin pas tertekan...", options: [
        { label: "Menghadapi, bukan menghindar", type: "avoid" },
        { label: "Ngaku lagi ga kuat", type: "tahan" },
        { label: "Ngerem reaksi", type: "ledak" },
        { label: "Mentingin diri sendiri dulu", type: "nolong" },
      ]},
      { text: "Setelah badai lewat, kamu sadar kamu...", options: [
        { label: "Lari dari banyak hal", type: "avoid" },
        { label: "Mendem terlalu banyak", type: "tahan" },
        { label: "Nyakitin orang tanpa sengaja", type: "ledak" },
        { label: "Lupa ngurus diri sendiri", type: "nolong" },
      ]},
    ],
    results: {
      avoid: { label: "Si Penunda", desc: "Kamu cenderung menjauh dulu pas tertekan. Wajar, tapi coba kasih diri ruang kecil buat balik menghadapi pelan-pelan." },
      tahan: { label: "Si Penahan Semua", desc: "Kamu keliatan kuat di luar tapi nyimpen banyak. Kamu boleh ga baik-baik aja, dan boleh cerita sebelum numpuk." },
      ledak: { label: "Si Cepat Panas", desc: "Tekanan bikin kamu gampang meledak. Itu sinyal kamu kelebihan beban, bukan tanda kamu jahat." },
      nolong: { label: "Si Penolong yang Lupa Diri", desc: "Kamu sibuk ngurus orang sampai lupa diri sendiri. Ngurus diri bukan egois." },
    },
  },
  {
    key: "conflict",
    title: "Gaya Aku Saat Konflik",
    emoji: "⚖️",
    intro: "Buat ngerti pola kamu pas berantem sama keluarga, teman, atau pasangan.",
    questions: [
      { text: "Pas ada konflik, kamu paling sering...", options: [
        { label: "Menghindar", type: "avoider" },
        { label: "Mengalah biar damai", type: "peace" },
        { label: "Menyerang balik", type: "fighter" },
        { label: "Cari jalan tengah", type: "solver" },
        { label: "Mendem lalu meledak", type: "volcano" },
      ]},
      { text: "Kalau orang nyolot duluan, kamu...", options: [
        { label: "Diem dan pergi", type: "avoider" },
        { label: "Ngalah aja", type: "peace" },
        { label: "Balas lebih keras", type: "fighter" },
        { label: "Ajak ngomong baik-baik", type: "solver" },
        { label: "Nahan, nyatet dalam hati", type: "volcano" },
      ]},
      { text: "Setelah berantem kamu biasanya...", options: [
        { label: "Ngejauh beberapa hari", type: "avoider" },
        { label: "Minta maaf duluan walau ga salah", type: "peace" },
        { label: "Masih kepikiran pengen menang", type: "fighter" },
        { label: "Pengen klarifikasi", type: "solver" },
        { label: "Keliatan tenang tapi dalemnya kesel", type: "volcano" },
      ]},
      { text: "Yang paling susah buat kamu pas konflik...", options: [
        { label: "Bertahan ngobrol", type: "avoider" },
        { label: "Bilang ga setuju", type: "peace" },
        { label: "Nurunin nada", type: "fighter" },
        { label: "Sabar pas ga didengerin", type: "solver" },
        { label: "Ngomong sebelum mendem", type: "volcano" },
      ]},
      { text: "Menurut kamu konflik yang sehat itu...", options: [
        { label: "Yang bisa dihindari", type: "avoider" },
        { label: "Yang cepat selesai walau ngalah", type: "peace" },
        { label: "Yang ada menang-kalah", type: "fighter" },
        { label: "Yang dua-duanya didengar", type: "solver" },
        { label: "Yang ga bikin mendem", type: "volcano" },
      ]},
    ],
    results: {
      avoider: { label: "Si Penghindar", desc: "Kamu milih mundur demi rasa aman. Sesekali coba bilang satu hal kecil sebelum pergi, biar ga numpuk." },
      peace: { label: "Si Penjaga Damai", desc: "Kamu rela ngalah demi suasana. Bagus, tapi kebutuhanmu juga valid buat disuarain." },
      fighter: { label: "Si Pejuang", desc: "Kamu berani bersuara. Energi itu kuat — tinggal jaga biar ga nyakitin orang yang kamu sayang." },
      solver: { label: "Si Pencari Solusi", desc: "Kamu cenderung nyari jalan tengah. Jaga diri biar ga capek jadi penengah terus." },
      volcano: { label: "Silent Volcano", desc: "Kamu nahan demi jaga suasana, tapi bisa meledak sekaligus. Latihan: ngomong lebih awal pakai kalimat pendek." },
    },
  },
  {
    key: "strengths",
    title: "Kekuatan Diam-Diammu",
    emoji: "🌱",
    intro: "Bukan nyari kekurangan, tapi kekuatan yang sering kamu pakai buat bertahan.",
    questions: [
      { text: "Hal yang sering dibilang orang soal kamu...", options: [
        { label: "Penyayang", type: "kindness" },
        { label: "Penasaran sama banyak hal", type: "curiosity" },
        { label: "Ga gampang nyerah", type: "perseverance" },
        { label: "Bijak ngeliat masalah", type: "perspective" },
        { label: "Selalu nyari sisi baik", type: "hope" },
      ]},
      { text: "Pas susah, yang nguatin kamu biasanya...", options: [
        { label: "Mikirin orang yang kusayang", type: "kindness" },
        { label: "Pengen ngerti kenapa", type: "curiosity" },
        { label: "Tekad buat bertahan", type: "perseverance" },
        { label: "Liat gambaran besarnya", type: "perspective" },
        { label: "Yakin bakal membaik", type: "hope" },
      ]},
      { text: "Temen sering dateng ke kamu buat...", options: [
        { label: "Dihangatin", type: "kindness" },
        { label: "Diajak mikir hal baru", type: "curiosity" },
        { label: "Diingetin buat ga nyerah", type: "perseverance" },
        { label: "Minta sudut pandang", type: "perspective" },
        { label: "Disuntik harapan", type: "hope" },
      ]},
      { text: "Hal kecil yang bikin kamu hidup...", options: [
        { label: "Bisa bantu orang", type: "kindness" },
        { label: "Belajar sesuatu", type: "curiosity" },
        { label: "Nyelesain yang susah", type: "perseverance" },
        { label: "Ngerti makna di balik kejadian", type: "perspective" },
        { label: "Ngebayangin masa depan", type: "hope" },
      ]},
      { text: "Kalau dunia lagi berat, kamu pegang...", options: [
        { label: "Kasih sayang", type: "kindness" },
        { label: "Rasa ingin tahu", type: "curiosity" },
        { label: "Ketahanan", type: "perseverance" },
        { label: "Kebijaksanaan", type: "perspective" },
        { label: "Harapan", type: "hope" },
      ]},
    ],
    results: {
      kindness: { label: "Kasih Sayang", desc: "Kekuatanmu ada di kepedulian. Inget juga buat nyayangin diri sendiri sebesar kamu nyayangin orang." },
      curiosity: { label: "Rasa Ingin Tahu", desc: "Kamu bertahan dengan terus penasaran. Itu yang bikin kamu terus tumbuh walau susah." },
      perseverance: { label: "Ketahanan", desc: "Kamu ga gampang nyerah. Kekuatan ini nyata — tapi istirahat juga bagian dari bertahan." },
      perspective: { label: "Kebijaksanaan", desc: "Kamu bisa ngeliat gambaran besar. Sudut pandangmu nenangin orang di sekitarmu." },
      hope: { label: "Harapan", desc: "Kamu selalu nemu sedikit cahaya. Harapanmu itu hadiah, buat diri sendiri dan orang lain." },
    },
  },
];

export function getQuiz(key: string): Quiz | null {
  return QUIZZES.find((q) => q.key === key) ?? null;
}
export function computeResult(quiz: Quiz, answers: string[]): string {
  const tally: Record<string, number> = {};
  for (const t of answers) tally[t] = (tally[t] ?? 0) + 1;
  let best = answers[0] ?? Object.keys(quiz.results)[0];
  let max = -1;
  for (const [t, c] of Object.entries(tally)) if (c > max) { max = c; best = t; }
  return best;
}
