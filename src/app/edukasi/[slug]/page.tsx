import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CRISIS_RESOURCE } from "@/core/crisisResources";
import { checkPremiumAccess } from "@/components/PremiumGate";
import { createClient } from "@/lib/supabase/server";
import { TTSButton } from "@/components/voice/TTSButton";

type Topic = { slug: string; title: string; emoji: string | null; definition: string | null };
type Tip = { id: string; tip_title: string; tip_content: string; sort_order: number };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("tip_topics")
    .select("title, definition")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return { title: "Topik tidak ditemukan — Soulpace" };

  return {
    title: `${data.title} — Tips & Edukasi · Soulpace`,
    description: data.definition ?? `Tips actionable untuk ${data.title}. Pendekatan psikologis.`,
    robots: { index: true, follow: true },
  };
}

export default async function EdukasiDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const _blocked_ = await checkPremiumAccess("edukasi");
  if (_blocked_) return _blocked_;

  const { slug } = await params;
  const supabase = await createClient();

  const [topicRes, tipsRes] = await Promise.all([
    supabase.from("tip_topics").select("slug, title, emoji, definition").eq("slug", slug).eq("is_active", true).maybeSingle(),
    supabase.from("tips").select("id, tip_title, tip_content, sort_order").eq("topic_slug", slug).eq("is_active", true).order("sort_order"),
  ]);

  const topic = topicRes.data as Topic | null;
  const tips = (tipsRes.data ?? []) as Tip[];

  if (!topic) notFound();

  // Build TTS text untuk seluruh topik
  const definitionTTS = topic.definition ?? "";
  const tipsTTS = tips.map(t => `${t.tip_title}. ${t.tip_content}`).join(" ");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <Link href="/edukasi" className="text-sm text-ink/55">← Semua topik</Link>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">Beranda</Link>
      </header>

      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-sky-50 via-purple-50 to-rose-50 p-6 ring-1 ring-sky-100">
        <p className="text-5xl">{topic.emoji ?? "📌"}</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">{topic.title}</h1>
      </section>

      {/* Definition */}
      {topic.definition && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-ink/8">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-wide font-semibold text-sky-700">Apa itu {topic.title}?</p>
            {definitionTTS && <TTSButton text={definitionTTS} label="Dengerin" />}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">{topic.definition}</p>
        </section>
      )}

      {/* Tips */}
      {tips.length === 0 ? (
        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="text-sm leading-relaxed text-ink/70">
            Tips untuk topik ini belum diisi admin. Kembali nanti.
          </p>
        </div>
      ) : (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-wide font-semibold text-ink/55">💡 Tips actionable</p>
            {tipsTTS && <TTSButton text={tipsTTS} label="Dengerin semua tips" />}
          </div>
          {tips.map((tip, i) => (
            <article key={tip.id} className="rounded-2xl bg-white p-4 ring-1 ring-ink/8">
              <div className="flex items-start gap-3">
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink">{tip.tip_title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/75 whitespace-pre-wrap">{tip.tip_content}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <div className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-200">
        <p className="text-xs leading-relaxed text-ink/70">
          ⚠️ Tips ini buat bantu sehari-hari, <strong>bukan pengganti</strong> profesional. Kalau berat &gt;2 minggu atau ada pikiran nyakitin diri, hubungi{" "}
          <span className="font-semibold text-ink/85">{CRISIS_RESOURCE.phone}</span> (SEJIWA, gratis 24 jam) atau{" "}
          <a href={CRISIS_RESOURCE.url} target="_blank" rel="nofollow noopener noreferrer" className="font-medium text-rose-600 underline">healing119.id</a>.
        </p>
      </div>

      <Link href="/edukasi" className="rounded-full bg-white px-4 py-3 text-center text-sm font-medium text-ink/70 ring-1 ring-sky-200">
        ← Topik lain
      </Link>
    </main>
  );
}
