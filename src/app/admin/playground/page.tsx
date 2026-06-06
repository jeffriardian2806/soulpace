import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfilesService } from "@/modules/profiles";
import {
  createPollAction,
  createRoomAction,
  setPollActiveAction,
  toggleRoomEntryAction,
} from "./actions";

export const metadata = { title: "Playground — Admin" };

export default async function AdminPlaygroundPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const svc = await getProfilesService();
  const profile = await svc.getProfile(user.id);
  if (profile?.role !== "moderator") redirect("/feed");

  const { data: polls } = await supabase
    .from("polls")
    .select("id, question, is_active, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, prompt, is_active")
    .order("created_at", { ascending: false })
    .limit(5);
  const { data: entries } = await supabase
    .from("room_entries")
    .select("id, body, hidden, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/feed" className="text-sm text-ink/50">← Feed</Link>
        <h1 className="text-xl font-bold text-ink">Playground (Admin)</h1>
      </header>

      <section className="glass rounded-2xl p-4">
        <h2 className="mb-2 text-sm font-bold text-ink">Buat polling baru</h2>
        <form action={createPollAction} className="flex flex-col gap-2">
          <input name="question" required placeholder="Pertanyaan polling"
            className="rounded-xl border border-sky-100 bg-white/70 px-3 py-2 text-sm" />
          <textarea name="options" required rows={4} placeholder="Satu opsi per baris (min 2)"
            className="rounded-xl border border-sky-100 bg-white/70 px-3 py-2 text-sm" />
          <button className="self-start rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white">Buat polling</button>
        </form>
        <div className="mt-3 flex flex-col gap-1">
          {(polls ?? []).map((p: { id: string; question: string; is_active: boolean }) => (
            <div key={p.id} className="flex items-center justify-between text-xs">
              <span className="text-ink/70">{p.is_active ? "🟢" : "⚪"} {p.question}</span>
              <form action={setPollActiveAction.bind(null, p.id, !p.is_active)}>
                <button className="text-sky-600">{p.is_active ? "Nonaktifkan" : "Aktifkan"}</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-2xl p-4">
        <h2 className="mb-2 text-sm font-bold text-ink">Set tema Ruang Hari Ini</h2>
        <form action={createRoomAction} className="flex flex-col gap-2">
          <input name="prompt" required placeholder="Tema, mis: Hal kecil yang bikin kamu bertahan minggu ini"
            className="rounded-xl border border-sky-100 bg-white/70 px-3 py-2 text-sm" />
          <button className="self-start rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white">Set tema (aktifkan)</button>
        </form>
        <div className="mt-2 text-xs text-ink/50">
          Aktif: {(rooms ?? []).find((r: { is_active: boolean }) => r.is_active)?.prompt ?? "—"}
        </div>
      </section>

      <section className="glass rounded-2xl p-4">
        <h2 className="mb-2 text-sm font-bold text-ink">Moderasi entri ruang</h2>
        <div className="flex flex-col gap-2">
          {(entries ?? []).map((e: { id: string; body: string; hidden: boolean }) => (
            <div key={e.id} className="flex items-center justify-between gap-3 text-xs">
              <span className={e.hidden ? "text-ink/30 line-through" : "text-ink/70"}>{e.body}</span>
              <form action={toggleRoomEntryAction.bind(null, e.id, e.hidden)}>
                <button className="shrink-0 text-sky-600">{e.hidden ? "Tampilkan" : "Sembunyikan"}</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
