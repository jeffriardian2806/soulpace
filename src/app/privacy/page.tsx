import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan Privasi Soulpace.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-5 px-6 py-10">
      <Link href="/" className="text-sm text-ink/50">← Kembali</Link>
      <h1 className="text-2xl font-bold text-ink">Kebijakan Privasi</h1>
      <p className="text-xs text-ink/45">Terakhir diperbarui: Juni 2026 · Versi beta</p>

      <section className="flex flex-col gap-4 text-sm leading-relaxed text-ink/75">
        <div>
          <h2 className="mb-1 font-semibold text-ink">1. Data yang dikumpulkan</h2>
          <p>Email (untuk login), kata sandi (disimpan terenkripsi), nama tampilan anonim yang dibuat otomatis, serta isi curhat, balasan, peluk, dan waktu aktivitasmu.</p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-ink">2. Yang tidak ditampilkan ke publik</h2>
          <p>Email dan identitas aslimu tidak pernah ditampilkan ke pengguna lain. Yang terlihat publik hanya nama tampilan anonim dan isi curhat/balasanmu.</p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-ink">3. Tujuan penggunaan data</h2>
          <p>Untuk menjalankan layanan: autentikasi login, menampilkan konten, dan notifikasi.</p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-ink">4. Pihak ketiga</h2>
          <p>Kami memakai Supabase (database & autentikasi), Vercel (hosting), dan Resend (pengiriman email). Mereka memproses data sesuai kebijakan masing-masing.</p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-ink">5. Penyimpanan & keamanan</h2>
          <p>Data disimpan di Supabase dengan kontrol akses. Tidak ada sistem yang 100% aman, namun kami berupaya menjaganya.</p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-ink">6. Hak kamu</h2>
          <p>Kamu bisa meminta penghapusan akun dan datamu dengan menghubungi kami.</p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-ink">7. Cookie</h2>
          <p>Kami memakai cookie hanya untuk menjaga sesi login kamu.</p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-ink">8. Perubahan & kontak</h2>
          <p>Kebijakan ini bisa diperbarui sewaktu-waktu. Pertanyaan: <b>jeffriardian.kuningan@gmail.com</b>.</p>
        </div>
      </section>

      <Link href="/terms" className="text-sm text-sky-600 underline">Ketentuan Layanan →</Link>
    </main>
  );
}
