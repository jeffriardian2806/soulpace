import Link from "next/link";
import { ReactNode } from "react";

export function LaporanShell({ title, takenAt, children }: { title: string; takenAt?: string | null; children: ReactNode }) {
  const dateStr = takenAt ? new Date(takenAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : null;
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between gap-3">
        <Link href="/profile" className="text-sm text-ink/50">← Profil</Link>
        <h1 className="text-base font-bold text-ink text-right truncate">📄 {title}</h1>
      </header>
      {dateStr && <p className="text-xs text-ink/45">Diisi {dateStr}</p>}
      {children}
      <div className="rounded-2xl bg-ink/5 p-3">
        <p className="text-[11px] leading-relaxed text-ink/55">
          <strong>Disclaimer:</strong> Laporan ini bukan diagnosis klinis. Hanya alat refleksi & eksplorasi diri. Kalau kamu butuh penanganan profesional, konsultasi ke psikolog atau psikiater. Crisis line: SEJIWA 119 ext 8 (gratis, 24 jam).
        </p>
      </div>
    </main>
  );
}

export function LaporanSection({ icon, title, hint, children }: { icon?: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="text-sm font-bold text-ink">{icon ? `${icon} ` : ""}{title}</h2>
      {hint && <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function LaporanActions({ retakeHref }: { retakeHref: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={retakeHref} className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white">
        🔄 Ulangi tes
      </Link>
      <Link href="/profile" className="rounded-full bg-white/70 px-5 py-2 text-sm font-medium text-ink/70 ring-1 ring-sky-100">
        Kembali ke profil
      </Link>
    </div>
  );
}

export function HeroCard({ emoji, label, headline, value, gradient = "from-sky-400 via-purple-400 to-rose-400" }: { emoji?: string; label: string; headline: string; value?: string; gradient?: string }) {
  return (
    <div className={`rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white shadow-2xl`}>
      {emoji && <p className="text-5xl">{emoji}</p>}
      <p className="mt-2 text-xs uppercase tracking-wide text-white/70">{label}</p>
      <p className="mt-1 text-2xl font-bold leading-tight">{headline}</p>
      {value && <p className="mt-2 text-sm leading-relaxed text-white/90">{value}</p>}
    </div>
  );
}
