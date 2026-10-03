import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KompasPlayer, type CompassQuestion, type CompassType, type CompassMajor } from "@/components/games/KompasPlayer";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Kompas Jurusan — Soulpace" };

export default async function KompasPage() {
  const _blocked_ = await checkPremiumAccess("kompas");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const [{ data: qRows }, { data: tRows }, { data: mRows }] = await Promise.all([
    supabase.from("compass_questions").select("id, text, letter").eq("is_active", true).order("sort_order"),
    supabase.from("compass_types").select("letter, name, tagline, description, traits").eq("is_active", true).order("sort_order"),
    supabase.from("compass_majors").select("id, name, description, primary_letters, careers").eq("is_active", true).order("sort_order"),
  ]);
  const questions = (qRows ?? []) as CompassQuestion[];
  const types = (tRows ?? []) as CompassType[];
  const majors = (mRows ?? []) as CompassMajor[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🧭 Kompas Jurusan</h1>
      </header>
      <p className="text-sm text-ink/60">{questions.length} pertanyaan berbasis Holland Code (RIASEC). Dapat top 3 tipe minat + rekomendasi {majors.length} jurusan kuliah Indonesia.</p>
      <KompasPlayer questions={questions} types={types} majors={majors} />
    </main>
  );
}
