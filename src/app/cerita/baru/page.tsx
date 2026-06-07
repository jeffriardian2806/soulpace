import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoryForm } from "@/components/StoryForm";

export const metadata = { title: "Tulis Cerita — Soulpace" };

export default async function CeritaBaruPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/cerita" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-medium text-ink">Tulis Cerita</h1>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Tulis langsung apa yang ada di kepalamu. Nanti kalau mau dilanjutin, kamu bisa tambah
        episode lagi kapan saja.
      </p>
      <StoryForm />
    </main>
  );
}
