import Link from "next/link";
import { CRISIS_RESOURCE } from "@/core/crisisResources";

export const revalidate = 86400;

export const metadata = {
  title: "Panduan & FAQ — Flouwell",
  description: "Pertanyaan umum seputar Flouwell: anonimitas, cara curhat, cerita, peluk, dan fitur lainnya.",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Apa itu Flouwell?",
    a: "Flouwell adalah ruang aman untuk melampiaskan beban dan keluh kesah secara anonim, tanpa dihakimi. Di sini kamu bisa curhat, baca cerita orang lain, melacak mood, menulis jurnal, dan lainnya.",
  },
  {
    q: "Apakah benar-benar anonim?",
    a: "Iya. Kamu pakai nama samaran (handle), bukan nama asli. Curhat dan cerita kamu tidak menampilkan identitas asli. Jangan menulis data pribadi yang bisa mengenali kamu (nama lengkap, alamat, nomor HP) demi keamanan kamu sendiri.",
  },
  {
    q: "Apa itu 'Peluk'?",
    a: "Peluk adalah cara memberi dukungan ke sebuah curhat atau cerita, mirip pelukan virtual. Ini bukan 'like' atau ajang adu populer, hanya tanda 'kamu nggak sendirian'.",
  },
  {
    q: "Bedanya Curhat dan Cerita?",
    a: "Curhat itu unggahan singkat di beranda untuk melepaskan apa yang kamu rasakan saat itu. Cerita itu tulisan panjang yang bisa dibagi jadi beberapa episode, untuk berbagi perjalanan hidup yang lebih utuh. Cerita bisa dibaca, dikomentari, dan dipeluk siapa saja.",
  },
  {
    q: "Cerita saya bisa dilihat di Google?",
    a: "Cerita bersifat publik dan bisa muncul di pencarian Google supaya lebih banyak orang terbantu. Beranda, profil, dan tools lain tetap privat (tidak diindeks). Kalau ada hal sensitif, gunakan fitur peringatan isi (content warning) saat menulis.",
  },
  {
    q: "Apa fungsi Mood, Jurnal, Surat, dan Syukur?",
    a: "Mood untuk mencatat perasaan harian dan melihat polanya. Jurnal untuk menulis pribadi. Surat untuk menulis pesan ke diri sendiri di masa depan. Syukur untuk mencatat hal-hal positif yang kamu syukuri. Semua ini privat, hanya kamu yang bisa lihat.",
  },
  {
    q: "Apa itu Skrining?",
    a: "Skrining adalah alat bantu mandiri (seperti PHQ-9 dan GAD-7) untuk mengenali kondisi perasaanmu. Ini BUKAN diagnosis. Hasilnya hanya gambaran awal — untuk kepastian, tetap konsultasi ke tenaga profesional.",
  },
  {
    q: "Bagaimana kalau ada konten yang tidak pantas?",
    a: "Gunakan tombol 'Laporkan' pada unggahan tersebut. Tim moderasi akan meninjau. Kami ingin Flouwell tetap jadi ruang yang aman dan saling mendukung.",
  },
  {
    q: "Saya sedang dalam keadaan darurat / berpikir menyakiti diri. Harus apa?",
    a: `Kamu tidak sendirian dan bantuan tersedia. Hubungi ${CRISIS_RESOURCE.phone} (SEJIWA, gratis 24 jam) atau kunjungi ${CRISIS_RESOURCE.url}. Kalau ada bahaya langsung, hubungi layanan darurat terdekat.`,
  },
];

export default function PanduanPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Panduan &amp; FAQ</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">
          Kembali ke beranda
        </Link>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Pertanyaan yang sering ditanyakan seputar Flouwell.
      </p>

      <div className="flex flex-col gap-3">
        {FAQ.map((item, i) => (
          <div key={i} className="glass rounded-2xl p-4">
            <p className="text-sm font-semibold text-ink">{item.q}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-2 rounded-2xl bg-sky-50 p-4 text-sm leading-relaxed text-ink/70">
        Masih ada pertanyaan atau masukan? Kirim lewat{" "}
        <Link href="/masukan" className="font-medium text-sky-600 underline">
          Kritik &amp; Saran
        </Link>
        .
      </div>
    </main>
  );
}
