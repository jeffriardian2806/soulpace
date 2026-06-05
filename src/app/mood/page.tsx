import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MoodTracker } from "@/components/MoodTracker";
import { MoodInsight } from "@/components/MoodInsight";

export const metadata = { title: "Mood Tracker — Soulpace" };

export default async function MoodPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("mood_entries")
    .select("entry_date, mood, note")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })
    .limit(150);

  const initialEntries = (data ?? []).map((r) => ({
    date: r.entry_date as string,
    mood: r.mood as number,
    note: (r.note as string | null) ?? null,
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Mood Tracker</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">
          Kembali ke beranda
        </Link>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Catat perasaanmu tiap hari. Cuma kamu yang bisa lihat ini.
      </p>
      <MoodTracker initialEntries={initialEntries} />
      <MoodInsight entries={initialEntries} />
    </main>
  );
}
