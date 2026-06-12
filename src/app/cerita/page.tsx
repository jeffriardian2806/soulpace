import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Cerita — Soulpace",
  description: "Kisah dan perjalanan hidup yang dibagikan secara anonim.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

type Story = {
  id: string;
  title: string;
  summary: string | null;
  content_warning: string | null;
  created_at: string;
  peluk_boost: number;
  author_id: string;
};

export default async function CeritaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rows, error } = await supabase
    .from("stories")
    .select("id, title, summary, content_warning, created_at, peluk_boost, author_id")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) console.error("[cerita] query error:", error.message, error.details);

  const stories = (rows ?? []) as Story[];

  // batch handles + counts
  const handles: Record<string, string> = {};
  const epCount: Record<string, number> = {};
  const plkCount: Record<string, number> = {};
  if (stories.length > 0) {
    const authorIds = Array.from(new Set(stories.map((s) => s.author_id)));
    const storyIds = stories.map((s) => s.id);
    const [{ data: profs }, { data: eps }, { data: plks }] = await Promise.all([
      supabase.from("profiles").select("id, handle").in("id", authorIds),
      supabase.from("story_episodes").select("story_id").in("story_id", storyIds),
      supabase.from("story_peluk").select("story_id").in("story_id", storyIds),
    ]);
    (profs ?? []).forEach((p: { id: string; handle: string }) => { handles[p.id] = p.handle; });
    (eps ?? []).forEach((r: { story_id: string }) => { epCount[r.story_id] = (epCount[r.story_id] ?? 0) + 1; });
    (plks ?? []).forEach((r: { story_id: string }) => { plkCount[r.story_id] = (plkCount[r.story_id] ?? 0) + 1; });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Cerita</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">Kembali ke beranda</Link>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Bagikan kisah dan perjalanan hidup Anda secara anonim dalam ruang yang aman dan suportif.
      </p>

      {user && (
        <Link href="/cerita/baru" className="rounded-xl bg-sky-500 px-4 py-2.5 text-center text-sm font-semibold text-white">
          + Tulis cerita
        </Link>
      )}

      {stories.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/40">Belum ada cerita. Jadi yang pertama berbagi.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {stories.map((s) => (
            <Link key={s.id} href={`/cerita/${s.id}`} className="glass block rounded-2xl p-4 transition-colors hover:bg-sky-50">
              <p className="text-sm font-semibold text-ink">{s.title}</p>
              {s.content_warning && (
                <p className="mt-1 text-[11px] font-medium text-amber-700">⚠ Peringatan: {s.content_warning}</p>
              )}
              {s.summary && (
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink/70">{s.summary}</p>
              )}
              <p className="mt-2 text-xs text-ink/45">
                oleh {handles[s.author_id] ?? "Anonim"} · {epCount[s.id] ?? 0} episode · {(plkCount[s.id] ?? 0) + (s.peluk_boost ?? 0)} peluk
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
