import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createGratitudeAction, deleteGratitudeAction } from "@/app/syukur/actions";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Rasa Syukur — Soulpace" };

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Row = { id: string; items: string[]; created_at: string };

export default async function SyukurPage() {
  const _blocked_ = await checkPremiumAccess("syukur");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("gratitude_entries")
    .select("id, items, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);
  const entries = (data ?? []) as Row[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Rasa Syukur</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">
          Kembali ke beranda
        </Link>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Tulis minimal 3 hal yang kamu syukuri hari ini, sekecil apa pun. Cuma kamu yang bisa
        lihat ini.
      </p>

      <form action={createGratitudeAction} className="glass flex flex-col gap-2 rounded-2xl p-4">
        {[1, 2, 3].map((n) => (
          <input
            key={n}
            name={`item_${n}`}
            required
            maxLength={300}
            placeholder={`${n}. Hal yang kamu syukuri...`}
            className="rounded-xl border border-ink/10 bg-white/60 p-2.5 text-sm text-ink outline-none focus:border-sky-300"
          />
        ))}
        {[4, 5].map((n) => (
          <input
            key={n}
            name={`item_${n}`}
            maxLength={300}
            placeholder={`${n}. (opsional)`}
            className="rounded-xl border border-ink/10 bg-white/60 p-2.5 text-sm text-ink outline-none focus:border-sky-300"
          />
        ))}
        <button className="mt-1 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white">
          Simpan
        </button>
      </form>

      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink/40">Belum ada catatan syukur.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e) => (
            <div key={e.id} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-ink/45">{fmt(e.created_at)}</p>
                <form action={deleteGratitudeAction}>
                  <input type="hidden" name="id" value={e.id} />
                  <button className="text-xs font-medium text-rose-400 hover:underline">
                    Hapus
                  </button>
                </form>
              </div>
              <ul className="mt-1.5 space-y-1">
                {e.items.map((it, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink/85">
                    <span className="text-sky-400">•</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
