import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfilesService } from "@/modules/profiles";
import { Stars } from "@/components/Stars";

export const metadata = { title: "Masukan Pengguna — Admin" };

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Row = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { handle: string } | null;
};

export default async function AdminMasukanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = await getProfilesService();
  const profile = await svc.getProfile(user.id);
  if (profile?.role !== "moderator") redirect("/feed");

  const { data } = await supabase
    .from("app_feedback")
    .select("id, rating, comment, created_at, profiles!inner(handle)")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as Row[];
  const avg = rows.length
    ? rows.reduce((a, b) => a + b.rating, 0) / rows.length
    : 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/settings" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">Masukan Pengguna</h1>
      </header>

      <div className="glass rounded-2xl p-4">
        <p className="text-xs text-ink/45">Rata-rata rating</p>
        <p className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-ink">
          {rows.length ? `${avg.toFixed(1)}/5` : "Belum ada"}
          {rows.length > 0 && <Stars value={Math.round(avg)} />}
          <span className="font-normal text-ink/45">· {rows.length} masukan</span>
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink/40">Belum ada masukan.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div key={r.id} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                <p className="text-xs text-ink/45">
                  {r.profiles?.handle ?? "Anonim"} · {fmt(r.created_at)}
                </p>
              </div>
              {r.comment && (
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
                  {r.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
