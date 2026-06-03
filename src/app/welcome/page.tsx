import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-ink">Selamat datang di Soulpace</h1>
        <p className="mt-2 text-ink/65">
          Ini ruang aman untuk melampiaskan beban. Sebelum mulai, beberapa hal
          kecil yang kita jaga bareng:
        </p>
      </div>

      <div className="glass rounded-2xl p-5">
        <ul className="flex flex-col gap-3 text-sm leading-relaxed text-ink/80">
          <li>Di sini tidak ada yang menghakimi. Dengarkan dengan empati.</li>
          <li>Jaga anonimitas dirimu dan orang lain.</li>
          <li>Tanggapi dengan menguatkan, bukan menyerang.</li>
          <li>Kalau melihat sesuatu yang berbahaya, gunakan tombol Laporkan.</li>
        </ul>
      </div>

      <div className="rounded-2xl bg-sky-50 p-4 text-xs leading-relaxed text-ink/70">
        <p className="font-semibold text-ink/80">Penting</p>
        <p className="mt-1">
          Soulpace bukan pengganti bantuan profesional. Kalau kamu sedang dalam
          krisis atau butuh penanganan medis, hubungi tenaga profesional atau
          layanan darurat. Kami ada untuk menemani, bukan menggantikan terapi.
        </p>
      </div>

      <Link
        href="/feed"
        className="rounded-2xl bg-sky-500 px-4 py-3 text-center font-semibold text-white"
      >
        Saya mengerti, masuk
      </Link>
    </main>
  );
}
