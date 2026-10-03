import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pusat Bantuan — Soulpace",
  description: "Daftar crisis line, psikolog, dan artikel edukasi mental health terpercaya di Indonesia.",
  robots: { index: true, follow: true },
};

type Resource = {
  id: string;
  slug: string;
  kind: "crisis_line" | "psychologist" | "article" | "community" | "worksheet";
  title: string;
  subtitle: string | null;
  body: string | null;
  url: string | null;
  phone: string | null;
  location: string | null;
  meta: Record<string, unknown>;
  tags: string[];
};

const KIND_META: Record<Resource["kind"], { emoji: string; label: string; tagline: string; gradient: string }> = {
  crisis_line:  { emoji: "🆘", label: "Crisis Line",            tagline: "Layanan darurat 24 jam — gratis & rahasia",                     gradient: "from-rose-400 to-orange-400" },
  psychologist: { emoji: "🧠", label: "Psikolog & Psikiater",   tagline: "Praktisi profesional buat konsultasi terstruktur",             gradient: "from-sky-400 to-indigo-400" },
  article:      { emoji: "📖", label: "Artikel & Edukasi",      tagline: "Sumber bacaan terpercaya buat ngerti diri & topik MH",          gradient: "from-emerald-400 to-teal-400" },
  community:    { emoji: "🤝", label: "Komunitas Support",      tagline: "Komunitas peer & kelompok dukungan",                            gradient: "from-purple-400 to-pink-400" },
  worksheet:    { emoji: "📋", label: "Worksheet & Tools",      tagline: "Lembar latihan self-help yang bisa kamu kerjain sendiri",       gradient: "from-amber-400 to-yellow-400" },
};

const KIND_ORDER: Resource["kind"][] = ["crisis_line", "psychologist", "article", "community", "worksheet"];

export default async function ResourcePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resources")
    .select("id, slug, kind, title, subtitle, body, url, phone, location, meta, tags")
    .eq("is_active", true)
    .order("kind")
    .order("sort_order");

  const all = (data ?? []) as Resource[];
  const grouped = new Map<Resource["kind"], Resource[]>();
  all.forEach((r) => {
    if (!grouped.has(r.kind)) grouped.set(r.kind, []);
    grouped.get(r.kind)!.push(r);
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">🌐 Pusat Bantuan</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">Kembali ke beranda</Link>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Soulpace bukan pengganti bantuan profesional. Di sini ada daftar layanan darurat, psikolog, & sumber edukasi terpercaya yang bisa kamu hubungi langsung.
      </p>

      {KIND_ORDER.map((kind) => {
        const list = grouped.get(kind) ?? [];
        if (list.length === 0) return null;
        const km = KIND_META[kind];
        return (
          <section key={kind} className="flex flex-col gap-3">
            <div className={`rounded-2xl bg-gradient-to-br ${km.gradient} p-4 text-white`}>
              <p className="text-2xl">{km.emoji}</p>
              <p className="mt-1 text-base font-bold">{km.label}</p>
              <p className="mt-0.5 text-xs text-white/80">{km.tagline}</p>
            </div>
            {list.map((r) => <ResourceCard key={r.id} resource={r} />)}
          </section>
        );
      })}

      {all.length === 0 && (
        <div className="rounded-2xl bg-sky-50/50 p-6 text-center">
          <p className="text-3xl">📭</p>
          <p className="mt-2 text-sm text-ink/65">Belum ada resource yang terdaftar.</p>
        </div>
      )}
    </main>
  );
}

function ResourceCard({ resource: r }: { resource: Resource }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-base font-bold text-ink">{r.title}</p>
        {r.location && <span className="text-[10px] text-ink/45">📍 {r.location}</span>}
      </div>
      {r.subtitle && <p className="mt-0.5 text-xs italic text-ink/60">{r.subtitle}</p>}
      {r.body && <p className="mt-2 text-sm leading-relaxed text-ink/75">{r.body}</p>}

      {r.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {r.tags.map((t, i) => <span key={i} className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] text-sky-700">#{t}</span>)}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-3 flex flex-wrap gap-2">
        {r.phone && (
          <a href={`tel:${r.phone.replace(/\s+/g, "")}`} className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white">
            📞 {r.phone}
          </a>
        )}
        {r.url && (
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white">
            🌐 Buka situs
          </a>
        )}
      </div>
    </div>
  );
}
