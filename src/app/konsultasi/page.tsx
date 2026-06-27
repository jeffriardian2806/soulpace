import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllCategories, getUserConsultationSessions } from "@/lib/konsultasi/queries";

export const metadata = { title: "Konsultasi — Flouwell" };

const CATEGORY_EMOJI: Record<string, string> = {
  "keluarga": "👨‍👩‍👧",
  "pertemanan": "👥",
  "kerjaan": "💼",
  "percintaan": "❤️",
  "sekolah-kampus": "🎓",
  "mental-diri": "🧠",
  "lainnya": "🌐",
};

const CATEGORY_HINT: Record<string, string> = {
  "keluarga": "Pola hubungan, ortu/saudara, situasi rumah",
  "pertemanan": "Teman, circle, dinamika sosial",
  "kerjaan": "Burnout, atasan, beban kerja, lingkungan kantor",
  "percintaan": "Pasangan, hubungan asmara, putus, gebetan",
  "sekolah-kampus": "Akademik, dosen, beban tugas, lingkungan",
  "mental-diri": "Emosi, pikiran, pola diri internal",
  "lainnya": "Topik lain di luar 6 kategori utama",
};

export default async function KonsultasiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/konsultasi");

  const [categories, recentSessions] = await Promise.all([
    getAllCategories(),
    getUserConsultationSessions(3),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-5 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/feed" className="text-sm text-ink/50">← Kembali</Link>
      </header>

      <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-purple-50 p-5 ring-1 ring-sky-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">🩺 Konsultasi</p>
        <h1 className="mt-1 text-xl font-bold text-ink">Apa yang lagi lo alami?</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/65">
          Pilih cara konsultasi yang sesuai — langsung sama psikolog, atau mandiri AI-guided.
        </p>
      </div>

      {/* Telekonsul CTA — Live psikolog */}
      <Link
        href="/telekonsul"
        className="block rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-md hover:shadow-lg"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">👨‍⚕️</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">Live · 1-on-1</p>
            <p className="mt-0.5 text-base font-bold leading-tight">Konsul langsung sama psikolog</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-white/85">
              Chat real-time dengan psikolog mitra Flouwell. Privat. Gratis di beta.
            </p>
          </div>
          <span className="text-white/70">→</span>
        </div>
      </Link>

      {/* Recent sessions shortcut */}
      {recentSessions.length > 0 && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink">📋 Sesi terbaru lo</p>
            <Link href="/konsultasi/history" className="text-xs font-medium text-sky-700">
              Liat semua →
            </Link>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {recentSessions.map((s) => (
              <Link
                key={s.id}
                href={`/konsultasi/${s.id}`}
                className="rounded-xl bg-sky-50 p-3 ring-1 ring-sky-100 hover:bg-sky-100/70"
              >
                <p className="text-[11px] text-ink/50">
                  {new Date(s.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} · {s.category_name}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-ink/80">{s.keluhan_text}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Kategori picker — sesi mandiri (AI-guided rekam medis) */}
      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-bold text-ink">📝 Atau, konsul mandiri</span>
          <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-medium text-ink/55">AI-guided</span>
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-ink/55">
          Pilih kategori → tulis keluhan → liat saran. Hasil tersimpan sebagai rekam medis lo.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/konsultasi/sesi-baru/${cat.slug}`}
              className="group rounded-2xl bg-white p-4 ring-1 ring-ink/10 hover:bg-sky-50 hover:ring-sky-200"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{CATEGORY_EMOJI[cat.slug] ?? "📌"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink">{cat.name}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink/55">
                    {CATEGORY_HINT[cat.slug] ?? ""}
                  </p>
                </div>
                <span className="text-ink/30 group-hover:text-sky-600">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-100">
        💡 Konsultasi ini AI-guided, bukan pengganti psikolog/psikiater. Untuk masalah berat atau
        krisis, hubungi profesional atau buka <Link href="/crisis-mode" className="font-semibold underline">SAYA DI SINI</Link>.
      </div>
    </main>
  );
}
