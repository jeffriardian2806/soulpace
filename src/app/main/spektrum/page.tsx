import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SpektrumPlayer, type SpektrumCategory, type SpektrumQuestion } from "@/components/games/SpektrumPlayer";

export const metadata = { title: "Spektrum Sosial — Soulpace" };

export default async function SpektrumPage() {
  const supabase = await createClient();
  const [{ data: catRows }, { data: qRows }] = await Promise.all([
    supabase.from("personality_categories").select("id, slug, name, emoji, description").eq("is_active", true).order("sort_order"),
    supabase.from("personality_questions").select("id, category_id, text, options").eq("is_active", true).order("sort_order"),
  ]);
  const categories = (catRows ?? []) as SpektrumCategory[];
  const questions = (qRows ?? []) as SpektrumQuestion[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🌗 Spektrum Sosial</h1>
      </header>
      <p className="text-sm text-ink/60">{questions.length} pertanyaan dari {categories.length} kategori. Di akhir kamu dapet persentase introvert vs extrovert + breakdown per kategori.</p>
      <SpektrumPlayer categories={categories} questions={questions} />
    </main>
  );
}
