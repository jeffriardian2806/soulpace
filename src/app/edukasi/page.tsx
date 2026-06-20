import Link from "next/link";
import type { Metadata } from "next";
import { CRISIS_RESOURCE } from "@/core/crisisResources";
import { checkPremiumAccess } from "@/components/PremiumGate";
import { createClient } from "@/lib/supabase/server";
import { EdukasiClient } from "@/components/edukasi/EdukasiClient";

export const metadata: Metadata = {
  title: "Edukasi & Tips Kesehatan Mental — Soulpace",
  description:
    "Tips actionable per kondisi: overthinking, susah tidur, cemas, marah, sedih, burnout, dll. Plus definisi tiap kondisi dari sudut psikologi.",
  robots: { index: true, follow: true },
};

type Topic = { slug: string; title: string; emoji: string | null; definition: string | null; sort_order: number };
type Tip = { id: string; topic_slug: string; tip_title: string; tip_content: string; sort_order: number };

export default async function EdukasiPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const _blocked_ = await checkPremiumAccess("edukasi");
  if (_blocked_) return _blocked_;

  const sp = await searchParams;
  const supabase = await createClient();
  const [topicsRes, tipsRes] = await Promise.all([
    supabase.from("tip_topics").select("slug, title, emoji, definition, sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("tips").select("id, topic_slug, tip_title, tip_content, sort_order").eq("is_active", true).order("topic_slug").order("sort_order"),
  ]);

  const topics = (topicsRes.data ?? []) as Topic[];
  const tips = (tipsRes.data ?? []) as Tip[];

  // Group tips per topic
  const topicsWithTips = topics.map(t => ({
    ...t,
    tips: tips.filter(x => x.topic_slug === t.slug),
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">📚 Edukasi & Tips</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">← Beranda</Link>
      </header>

      <div className="rounded-2xl bg-sky-50 p-4 text-sm leading-relaxed text-ink/70">
        Tips di sini buat bantu sehari-hari, <strong>bukan pengganti</strong> bantuan profesional. Kalau perasaan berat &gt;2 minggu atau ada pikiran nyakitin diri, hubungi{" "}
        <span className="font-semibold text-ink/85">{CRISIS_RESOURCE.phone}</span> (SEJIWA, gratis 24 jam) atau{" "}
        <a href={CRISIS_RESOURCE.url} target="_blank" rel="nofollow noopener noreferrer" className="font-medium text-sky-600 underline">healing119.id</a>.
      </div>

      {topicsWithTips.length === 0 ? (
        <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200">
          <p className="text-3xl">🔧</p>
          <p className="mt-2 text-base font-bold text-ink">Konten belum siap</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/70">
            Admin perlu run migration <code className="rounded bg-ink/5 px-1 py-0.5 text-xs">0039</code> & <code className="rounded bg-ink/5 px-1 py-0.5 text-xs">0040</code> dulu.
          </p>
        </div>
      ) : (
        <EdukasiClient topics={topicsWithTips} initialTopic={sp.topic ?? null} />
      )}

      <Link href="/skrining" className="glass mt-2 flex items-center justify-between rounded-2xl p-4 transition-colors hover:bg-sky-100">
        <span className="text-sm font-medium text-ink">
          Coba skrining kesehatan mental
          <span className="block text-xs font-normal text-ink/55">PHQ-9, GAD-7, OCI-R, MDQ, PTSD</span>
        </span>
        <span className="text-sky-600">→</span>
      </Link>

      <p className="pb-4 text-center text-xs text-ink/40">
        Sumber: pendekatan umum CBT, DBT, &amp; mindfulness research. Sesuaikan kondisi, konsultasi profesional bila perlu.
      </p>
    </main>
  );
}
