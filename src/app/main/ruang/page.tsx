import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RoomForm } from "@/components/RoomForm";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Ruang Hari Ini — Soulpace" };

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

export default async function RuangPage() {
  const _blocked_ = await checkPremiumAccess("ruang");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("id, prompt")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let entries: { id: string; body: string; created_at: string }[] = [];
  if (room) {
    const { data } = await supabase
      .from("room_entries")
      .select("id, body, created_at")
      .eq("room_id", room.id)
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .limit(100);
    entries = (data ?? []) as typeof entries;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Main</Link>
        <h1 className="text-lg font-bold text-ink">🪟 Ruang Hari Ini</h1>
      </header>
      {room ? (
        <>
          <div className="rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 p-4 text-white">
            <p className="text-xs uppercase tracking-wide text-white/70">Tema hari ini</p>
            <p className="mt-1 text-sm font-medium leading-relaxed">{room.prompt}</p>
          </div>
          <RoomForm roomId={room.id} />
          <div className="flex flex-col gap-2">
            {entries.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink/40">Jadi yang pertama ngisi ruang ini.</p>
            ) : (
              entries.map((e) => (
                <div key={e.id} className="glass rounded-2xl p-3">
                  <p className="text-sm leading-relaxed text-ink/80">{e.body}</p>
                  <p className="mt-1 text-xs text-ink/40" suppressHydrationWarning>{timeAgo(e.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <p className="py-10 text-center text-sm text-ink/40">Belum ada ruang aktif. Cek lagi nanti ya.</p>
      )}
    </main>
  );
}
