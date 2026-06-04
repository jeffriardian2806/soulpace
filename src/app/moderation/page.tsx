import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfilesService } from "@/modules/profiles";
import { getPostsService } from "@/modules/posts";
import { getRepliesService } from "@/modules/replies";
import { getReportsService } from "@/modules/reports";
import { takedownAction, dismissAction } from "./actions";

export default async function ModerationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profiles = await getProfilesService();
  const profile = await profiles.getProfile(user.id);
  if (profile?.role !== "moderator") redirect("/feed");

  const reportsSvc = await getReportsService();
  const reports = await reportsSvc.listOpen();

  const postsSvc = await getPostsService();
  const repliesSvc = await getRepliesService();

  const enriched = await Promise.all(
    reports.map(async (r) => {
      let body = "(konten tidak ditemukan)";
      let handle = "";
      if (r.targetType === "post") {
        const p = await postsSvc.getPost(r.targetId);
        if (p) {
          body = p.body;
          handle = p.authorHandle;
        }
      } else {
        const rep = await repliesSvc.getReply(r.targetId);
        if (rep) {
          body = rep.body;
          handle = rep.authorHandle;
        }
      }
      return { ...r, body, handle };
    })
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/feed" className="text-sm text-ink/50">
          ← Kembali
        </Link>
        <h1 className="text-xl font-bold text-ink">Moderasi</h1>
        <Link href="/admin/skrining" className="ml-auto text-xs font-medium text-sky-600 underline">
          Kelola skrining
        </Link>
      </header>

      <p className="text-sm text-ink/55">
        Laporan yang belum ditangani ({enriched.length}).
      </p>

      {enriched.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/40">
          Tidak ada laporan. Semua aman.
        </p>
      ) : (
        enriched.map((r) => (
          <div key={r.id} className="glass rounded-2xl p-4">
            <p className="mb-1 text-xs text-ink/45">
              {r.targetType === "post" ? "Curhat" : "Balasan"} · {r.handle}
            </p>
            <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {r.body}
            </p>
            {r.reason && (
              <p className="mb-3 text-xs text-ink/55">Alasan: {r.reason}</p>
            )}
            <div className="flex gap-2">
              <form action={takedownAction}>
                <input type="hidden" name="target_type" value={r.targetType} />
                <input type="hidden" name="target_id" value={r.targetId} />
                <input type="hidden" name="report_id" value={r.id} />
                <button className="rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white">
                  Hapus konten
                </button>
              </form>
              <form action={dismissAction}>
                <input type="hidden" name="report_id" value={r.id} />
                <button className="rounded-xl bg-sky-100 px-4 py-2 text-xs font-semibold text-sky-700">
                  Abaikan laporan
                </button>
              </form>
            </div>
          </div>
        ))
      )}
    </main>
  );
}
