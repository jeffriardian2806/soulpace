import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPsikologBySlug, getChatFreeFlag } from "@/lib/telekonsul/queries";
import { startChatRedirectAction } from "@/app/telekonsul/actions";

export default async function PsikologProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from_session?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const fromSession = sp.from_session;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/telekonsul/${slug}`);

  const psikolog = await getPsikologBySlug(slug);
  if (!psikolog) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
        <Link href="/telekonsul" className="text-sm text-ink/50">
          ← Kembali
        </Link>
        <p className="py-12 text-center text-sm text-ink/50">Psikolog tidak ditemukan.</p>
      </main>
    );
  }

  const chatFree = await getChatFreeFlag();
  const effectiveFree = chatFree || psikolog.is_chat_free_promo || psikolog.price_chat === 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/telekonsul" className="text-sm text-ink/50">
          ← Kembali
        </Link>
      </header>

      <section className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5 text-center ring-1 ring-ink/10">
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-sky-100">
          {psikolog.photo_url ? (
            <Image src={psikolog.photo_url} alt={psikolog.full_name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">🧑‍⚕️</div>
          )}
        </div>
        <div>
          <p className="text-lg font-bold text-ink">{psikolog.full_name}</p>
          {psikolog.gelar && <p className="text-xs text-ink/60">{psikolog.gelar}</p>}
        </div>
        {psikolog.str_number && (
          <p className="text-[11px] text-ink/40">STR: {psikolog.str_number}</p>
        )}
      </section>

      {psikolog.bio && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Tentang</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/80">{psikolog.bio}</p>
        </section>
      )}

      {psikolog.specializations.length > 0 && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Spesialisasi</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {psikolog.specializations.map((s) => (
              <span
                key={s}
                className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-100"
              >
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl bg-white p-3 ring-1 ring-ink/10">
          <p className="text-ink/50">Pengalaman</p>
          <p className="mt-0.5 font-bold text-ink">{psikolog.experience_years} thn</p>
        </div>
        <div className="rounded-xl bg-white p-3 ring-1 ring-ink/10">
          <p className="text-ink/50">Bahasa</p>
          <p className="mt-0.5 font-bold text-ink">{psikolog.languages.join(", ")}</p>
        </div>
        <div className="rounded-xl bg-white p-3 ring-1 ring-ink/10">
          <p className="text-ink/50">Rating</p>
          <p className="mt-0.5 font-bold text-ink">
            {psikolog.rating_count > 0 ? `⭐ ${psikolog.rating_avg.toFixed(1)}` : "—"}
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Tarif</p>
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2 ring-1 ring-sky-100">
            <span className="text-sm font-medium text-ink">💬 Chat</span>
            <span className="text-sm font-bold text-sky-700">
              {effectiveFree ? "GRATIS" : `Rp${psikolog.price_chat.toLocaleString("id-ID")}`}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-ink/5 px-3 py-2">
            <span className="text-sm text-ink/50">🎙️ Voice call</span>
            <span className="text-xs text-ink/40">Belum tersedia</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-ink/5 px-3 py-2">
            <span className="text-sm text-ink/50">🎥 Video call</span>
            <span className="text-xs text-ink/40">Belum tersedia</span>
          </div>
        </div>
      </section>

      {fromSession && (
        <div className="rounded-xl bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900 ring-1 ring-emerald-200">
          📋 Rekam medis konsultasi mandiri lo bakal auto-share ke <strong>{psikolog.full_name}</strong>. Saat sesi mulai, mereka langsung liat keluhan + hasil skrining lo.
        </div>
      )}

      <form action={startChatRedirectAction}>
        <input type="hidden" name="psikolog_id" value={psikolog.id} />
        {fromSession && <input type="hidden" name="consultation_session_id" value={fromSession} />}
        <button
          type="submit"
          disabled={!psikolog.accepts_new_patient}
          className="w-full rounded-2xl bg-gradient-to-br from-sky-500 to-purple-500 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {psikolog.accepts_new_patient ? "💬 Mulai Chat (Sesi 24 jam)" : "Sedang Tidak Terima Patient Baru"}
        </button>
      </form>

      <p className="text-center text-[10px] leading-relaxed text-ink/40">
        Dengan mulai sesi, lo setuju identitas (nama + email) di-share ke psikolog ini.
        Soulpace policy: dilarang share kontak off-platform (WA/IG/email pribadi).
      </p>
    </main>
  );
}
