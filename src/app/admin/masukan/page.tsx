import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfilesService } from "@/modules/profiles";
import { Stars } from "@/components/Stars";
import { toggleHiddenAction } from "./actions";

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
  hidden: boolean;
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
    .select("id, rating, comment, hidden, created_at, profiles!inner(handle)")
    .order("created_at", { ascending: false })
    .limit(300);
  const rows = (data ?? []) as unknown as Row[];
  const visible = rows.filter((r) => !r.hidden);
  const avg = visible.length
    ? visible.reduce((a, b) => a + b.rating, 0) / visible.length
    : 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/settings" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">Masukan Pengguna</h1>
      </header>

      <div className="glass rounded-2xl p-4">
        <p className="text-xs text-ink/45">Rata-rata (yang tampil publik)</p>
        <p className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-ink">
          {visible.length ? `${avg.toFixed(1)}/5` : "Belum ada"}
          {visible.length > 0 && <Stars value={Math.round(avg)} />}
          <span className="font-normal text-ink/45">  {visible.length} tampil  {rows.length - visible.length} disembunyikan</span>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink/50">
          Semua ulasan tampil publik apa adanya. Sembunyikan hanya yang spam atau serangan, bukan
          kritik jujur.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink/40">Belum ada masukan.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className={`glass rounded-2xl p-4 ${r.hidden ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                <p className="text-xs text-ink/45">
                  <span>{r.profiles?.handle ?? "Anonim"}</span>{"  "}<span>{fmt(r.created_at)}</span>
                </p>
              </div>
              {r.comment && (
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
                  {r.comment}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                {r.hidden ? (
                  <span className="text-[11px] font-medium text-rose-500">Disembunyikan dari publik</span>
                ) : (
                  <span className="text-[11px] text-ink/40">Tampil publik</span>
                )}
                <form action={toggleHiddenAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="hidden" value={String(r.hidden)} />
                  <button className="text-xs font-medium text-sky-600 hover:underline">
                    {r.hidden ? "Tampilkan lagi" : "Sembunyikan (spam)"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
