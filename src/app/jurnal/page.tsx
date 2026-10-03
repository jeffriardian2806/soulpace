import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Jurnal Pribadi — Soulpace" };

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function JurnalPage() {
  const _blocked_ = await checkPremiumAccess("jurnal");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("journal_entries")
    .select("id, title, body, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const entries = data ?? [];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Jurnal Pribadi</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">
          Kembali ke beranda
        </Link>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Tempat aman buat nulis panjang. Cuma kamu yang bisa baca ini, nggak ada yang lihat.
      </p>

      <Link
        href="/jurnal/baru"
        className="rounded-xl bg-sky-500 px-4 py-2.5 text-center text-sm font-semibold text-white"
      >
        + Tulis jurnal baru
      </Link>

      {entries.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/40">
          Belum ada jurnal. Mulai tulis yang pertama yuk.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e) => (
            <Link
              key={e.id}
              href={`/jurnal/${e.id}`}
              className="glass block rounded-2xl p-4 transition-colors hover:bg-sky-50"
            >
              <p className="text-xs text-ink/45">{fmt(e.created_at as string)}</p>
              {e.title && (
                <p className="mt-0.5 text-sm font-semibold text-ink">{e.title}</p>
              )}
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink/70">
                {e.body}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
