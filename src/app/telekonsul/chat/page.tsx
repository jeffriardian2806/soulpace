import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInboxForUser } from "@/lib/telekonsul/queries";

export const metadata = { title: "Inbox Chat — Telekonsul" };

const TZ = "Asia/Jakarta";
const fmt = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function ChatInboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/telekonsul/chat");

  const threads = await getInboxForUser(user.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/telekonsul" className="text-sm text-ink/50">
          ← Kembali
        </Link>
        <h1 className="text-xl font-bold text-ink">📥 Inbox Telekonsul</h1>
      </header>

      <p className="text-[11px] text-ink/50">
        Semua sesi chat lo — sebagai patient (lo curhat) atau sebagai psikolog (lo bantu pasien).
      </p>

      {threads.length === 0 ? (
        <div className="rounded-2xl bg-ink/5 p-8 text-center">
          <p className="text-sm text-ink/50">Belum ada sesi chat.</p>
          <Link
            href="/telekonsul"
            className="mt-3 inline-block rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white"
          >
            Cari Psikolog →
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {threads.map((t) => {
            const asPsikolog = t.viewer_role === "psikolog";
            return (
              <li key={t.id}>
                <Link
                  href={`/telekonsul/chat/${t.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink/10 hover:ring-sky-200"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${
                      asPsikolog ? "bg-emerald-100" : "bg-sky-100"
                    }`}
                  >
                    {asPsikolog ? "🩺" : "🧑‍⚕️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-ink">
                        {asPsikolog
                          ? `Patient: ${t.patient_handle ?? "Anonim"}`
                          : `${t.psikolog?.full_name ?? "Psikolog"}${
                              t.psikolog?.gelar ? `, ${t.psikolog.gelar}` : ""
                            }`}
                      </p>
                      {asPsikolog && (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                          Lo psikolog
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink/50">
                      {t.status === "active" ? (
                        <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                          🟢 Aktif
                        </span>
                      ) : (
                        <span className="rounded-full bg-ink/10 px-1.5 py-0.5 text-ink/55">
                          {t.closed_reason === "expired" ? "⚪ Expired" : "⚪ Closed"}
                        </span>
                      )}
                      <span>·</span>
                      <span>Mulai {fmt(t.created_at)}</span>
                    </div>
                    {t.session_expires_at && t.status === "active" && (
                      <p className="mt-0.5 text-[10px] text-ink/40">
                        Window habis: {fmt(t.session_expires_at)} WIB
                      </p>
                    )}
                  </div>
                  <span className="text-ink/30">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
