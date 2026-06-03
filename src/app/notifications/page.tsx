import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotificationsService } from "@/modules/notifications";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = await getNotificationsService();
  const items = await svc.list(user.id);
  // Dibuka = tandai semua kebaca.
  await svc.markAllRead(user.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/feed" className="text-sm text-ink/50">
          ← Kembali
        </Link>
        <h1 className="text-xl font-bold text-ink">Notifikasi</h1>
      </header>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/40">
          Belum ada notifikasi.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((n) => {
            const text =
              n.type === "peluk"
                ? "Ada yang memeluk curhatmu"
                : "Ada balasan baru di curhatmu";
            const inner = (
              <div
                className={`glass rounded-2xl p-4 ${
                  n.read ? "" : "border-l-4 border-l-sky-400"
                }`}
              >
                <p className="text-sm text-ink">{text}</p>
                <p className="mt-1 text-xs text-ink/40">{timeAgo(n.createdAt)}</p>
              </div>
            );
            return n.postId ? (
              <Link key={n.id} href={`/post/${n.postId}`}>
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </main>
  );
}
