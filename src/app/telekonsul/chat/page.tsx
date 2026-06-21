import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInboxForPatient } from "@/lib/telekonsul/queries";

export const metadata = { title: "Inbox Chat — Telekonsul" };

export default async function ChatInboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/telekonsul/chat");

  const threads = await getInboxForPatient(user.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/telekonsul" className="text-sm text-ink/50">
          ← Kembali
        </Link>
        <h1 className="text-xl font-bold text-ink">📥 Inbox</h1>
      </header>

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
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                href={`/telekonsul/chat/${t.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink/10 hover:ring-sky-200"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-xl">
                  🧑‍⚕️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-bold text-ink">
                      {t.psikolog?.full_name}
                      {t.psikolog?.gelar && (
                        <span className="ml-1 font-normal text-ink/55">, {t.psikolog.gelar}</span>
                      )}
                    </p>
                    {t.status === "active" ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Aktif
                      </span>
                    ) : (
                      <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-semibold text-ink/55">
                        {t.closed_reason === "expired" ? "Expired" : "Closed"}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink/50">
                    {new Date(t.created_at).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {t.session_expires_at && t.status === "active" && (
                      <span className="ml-2">
                        · Expired{" "}
                        {new Date(t.session_expires_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-ink/30">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
