import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Cerita — Soulpace",
  description: "Kisah dan perjalanan hidup yang dibagikan secara anonim. Baca, dukung, dan belajar dari pengalaman orang lain.",
  robots: { index: true, follow: true },
};

type Row = {
  id: string;
  title: string;
  summary: string;
  content_warning: string | null;
  created_at: string;
  profiles: { handle: string } | null;
  story_episodes: { count: number }[];
  story_peluk: { count: number }[];
  peluk_boost: number;
};

export default async function CeritaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("stories")
    .select(
      "id, title, summary, content_warning, created_at, peluk_boost, profiles(handle), story_episodes(count), story_peluk(count)"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  const stories = (data ?? []) as unknown as Row[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Cerita</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">
          Kembali ke beranda
        </Link>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Kisah & perjalanan hidup yang dibagikan secara anonim. Baca pelan-pelan, dukung yang
        nulis, siapa tahu ada pelajaran buat kamu juga.
      </p>

      {user && (
        <Link
          href="/cerita/baru"
          className="rounded-xl bg-sky-500 px-4 py-2.5 text-center text-sm font-semibold text-white"
        >
          + Tulis cerita
        </Link>
      )}

      {stories.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/40">
          Belum ada cerita. Jadi yang pertama berbagi.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {stories.map((s) => (
            <Link
              key={s.id}
              href={`/cerita/${s.id}`}
              className="glass block rounded-2xl p-4 transition-colors hover:bg-sky-50"
            >
              <p className="text-sm font-semibold text-ink">{s.title}</p>
              {s.content_warning && (
                <p className="mt-1 text-[11px] font-medium text-amber-700">
                  ⚠ Peringatan: {s.content_warning}
                </p>
              )}
              {s.summary && (
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink/70">
                  {s.summary}
                </p>
              )}
              <p className="mt-2 text-xs text-ink/45">
                oleh {s.profiles?.handle ?? "Anonim"} ·{" "}
                {s.story_episodes?.[0]?.count ?? 0} episode ·{" "}
                {(s.story_peluk?.[0]?.count ?? 0) + (s.peluk_boost ?? 0)} peluk
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
