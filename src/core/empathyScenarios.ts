// Skenario "Pilih Respons Terbaik" — ngajarin balasan yang aman, bukan menghakimi.
// Skenario krisis diarahin ke pendampingan, BUKAN nasihat sok tau.
export interface EmpathyOption { text: string; safe: boolean; feedback: string }
export interface EmpathyScenario { id: string; topic: string; situation: string; options: EmpathyOption[] }

export const EMPATHY_SCENARIOS: EmpathyScenario[] = [
  {
    id: "s1", topic: "Umum",
    situation: "Seseorang nulis: \"Capek banget hidup gini terus, ngerasa ga ada yang peduli.\"",
    options: [
      { text: "Semangat ya, semua orang juga capek kok.", safe: false, feedback: "Niatnya baik, tapi ini ngecilin perasaan dia. 'Semua orang capek' bikin dia ngerasa keluhannya ga valid." },
      { text: "Jangan lebay, masih banyak yang lebih susah.", safe: false, feedback: "Ini membandingkan penderitaan. Bikin orang makin nutup diri." },
      { text: "Aku denger kamu. Capeknya pasti berat banget sampai nulis ini. Aku di sini.", safe: true, feedback: "Pas. Validasi dulu, hadir, tanpa buru-buru ngasih solusi." },
      { text: "Coba jalan-jalan biar fresh.", safe: false, feedback: "Solusi terlalu cepat sebelum dia ngerasa didengar." },
    ],
  },
  {
    id: "s2", topic: "Duka",
    situation: "Seseorang cerita baru kehilangan orang tuanya minggu lalu.",
    options: [
      { text: "Yang sabar ya, dia udah tenang di sana.", safe: false, feedback: "Klise yang sering bikin orang berduka ngerasa ga dimengerti." },
      { text: "Aku turut berduka. Ga apa-apa kalau kamu belum baik-baik aja. Aku temenin.", safe: true, feedback: "Pas. Ngakuin kehilangan + ngasih izin buat sedih + hadir." },
      { text: "Udah, jangan sedih terus, dia ga mau liat kamu gini.", safe: false, feedback: "Maksa berhenti sedih malah nambah beban." },
      { text: "Aku ngerti banget kok rasanya.", safe: false, feedback: "Ngeklaim ngerti banget bisa bikin dia ngerasa dukanya disepelein. Lebih aman bilang ga bisa sepenuhnya ngerti." },
    ],
  },
  {
    id: "s3", topic: "Krisis",
    situation: "Seseorang nulis isyarat pengen mengakhiri hidup.",
    options: [
      { text: "Jangan gitu, banyak yang sayang kamu.", safe: false, feedback: "Niat baik tapi bisa bikin dia ngerasa dihakimi & makin sendiri." },
      { text: "Aku ga mau kamu sendirian sekarang. Kamu berharga. Tolong hubungi SEJIWA 119 ext 8 ya, mereka siap 24 jam.", safe: true, feedback: "Pas. Hadir, validasi, dan arahin ke bantuan profesional — bukan nasihat dadakan." },
      { text: "Lebay ah, gitu doang.", safe: false, feedback: "Berbahaya. Meremehkan sinyal krisis bisa fatal." },
      { text: "Coba deh tidur, besok juga ilang.", safe: false, feedback: "Meremehkan & ngasih solusi instan ke situasi serius. Selalu arahin ke pendampingan." },
    ],
  },
  {
    id: "s4", topic: "Percintaan",
    situation: "Seseorang bingung, pacarnya makin dingin dan dia takut ditinggal.",
    options: [
      { text: "Udah putusin aja, ngapain dipertahanin.", safe: false, feedback: "Solusi maksa, ga ngasih ruang buat perasaannya." },
      { text: "Pasti kamu yang salah, introspeksi dong.", safe: false, feedback: "Menyalahkan, bikin dia makin ga aman." },
      { text: "Wajar takut, kepastian itu penting buat kamu. Mau cerita lebih lanjut apa yang kamu rasain?", safe: true, feedback: "Pas. Validasi rasa takut + buka ruang cerita." },
      { text: "Cowok/cewek mah banyak, santai.", safe: false, feedback: "Ngecilin perasaan dia." },
    ],
  },
  {
    id: "s5", topic: "Keluarga",
    situation: "Seseorang ngerasa ga pernah cukup di mata orang tuanya.",
    options: [
      { text: "Orang tua kan selalu bener, nurut aja.", safe: false, feedback: "Nutup perasaan dia, bukan dengerin." },
      { text: "Pasti kamu kurang usaha.", safe: false, feedback: "Menghakimi tanpa tahu konteks." },
      { text: "Berat ya ngerasa kayak gitu terus. Perasaan kamu valid kok.", safe: true, feedback: "Pas. Dengerin & validasi dulu." },
      { text: "Ah biasa aja, semua keluarga gitu.", safe: false, feedback: "Menggeneralisir & ngecilin." },
    ],
  },
];
