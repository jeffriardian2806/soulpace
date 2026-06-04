import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ketentuan Layanan",
  description: "Ketentuan Layanan Soulpace.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-5 px-6 py-10">
      <Link href="/" className="text-sm text-ink/50">← Kembali</Link>
      <h1 className="text-2xl font-bold text-ink">Ketentuan Layanan</h1>
      <p className="text-xs text-ink/45">Terakhir diperbarui: Juni 2026 · Versi beta</p>

      <section className="flex flex-col gap-4 text-sm leading-relaxed text-ink/75">
        <div>
          <h2 className="mb-1 font-semibold text-ink">1. Tentang Soulpace</h2>
          <p>Soulpace adalah ruang untuk berbagi keluh kesah dan saling menguatkan secara anonim. Saat ini Soulpace berada dalam tahap beta dan masih dikembangkan. Dengan memakai Soulpace, kamu setuju dengan ketentuan ini.</p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-ink">2. Bukan layanan darurat atau medis</h2>
          <p>Soulpace bukan pengganti bantuan profesional, terapi, atau layanan darurat. Kalau kamu sedang dalam krisis atau berpikir menyakiti diri, segera hubungi tenaga profesional atau layanan SEJIWA/Healing119 di <b>119 ext. 8</b> (gratis, 24 jam) atau <a className="text-sky-600 underline" href="https://www.healing119.id" target="_blank" rel="nofollow noopener noreferrer">healing119.id</a>.</p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-ink">3. Usia</h2>
          <p>Soulpace ditujukan untuk pengguna berusia minimal 17 tahun. Jika kamu di bawah itu, gunakan dengan pendampingan orang dewasa yang dipercaya.</p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-ink">4. Akun & anonimitas</h2>
          <p>Nama tampilanmu dibuat otomatis dan anonim. Jaga kerahasiaan dirimu sendiri dan orang lain. Jangan bagikan informasi yang bisa mengidentifikasi seseorang.</p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-ink">5. Aturan konten</h2>
          <p>Curhat yang jujur selalu dihormati. Namun dilarang: melecehkan, mengancam, atau merundung; menyebarkan data pribadi orang lain; konten ilegal; mendorong atau mengglorifikasi tindakan menyakiti diri sendiri atau orang lain; spam atau promosi.</p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-ink">6. Moderasi</h2>
          <p>Demi keamanan komunitas, kami berhak menghapus konten yang melanggar aturan atau membahayakan orang lain. Curhat yang jujur dan tidak menyakiti siapa pun tidak akan dihapus.</p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-ink">7. Tanggung jawab pengguna</h2>
          <p>Konten yang kamu tulis adalah tanggung jawabmu. Kamu setuju untuk tidak menyalahgunakan layanan.</p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-ink">8. Sifat beta</h2>
          <p>Layanan disediakan apa adanya dan bisa berubah, terganggu, atau dihentikan sewaktu-waktu. Selama beta, data bisa direset.</p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-ink">9. Perubahan & kontak</h2>
          <p>Ketentuan ini bisa diperbarui sewaktu-waktu. Pertanyaan bisa disampaikan ke: <b>[EMAIL_KONTAK_KAMU]</b>.</p>
        </div>
      </section>

      <Link href="/privacy" className="text-sm text-sky-600 underline">Kebijakan Privasi →</Link>
    </main>
  );
}
