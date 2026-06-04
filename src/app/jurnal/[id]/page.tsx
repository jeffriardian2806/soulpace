import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteJournalAction } from "@/app/jurnal/actions";

export const metadata = { title: "Jurnal — Soulpace" };

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function JurnalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: entry } = await supabase
    .from("journal_entries")
    .select("id, title, body, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!entry) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
        <Link href="/jurnal" className="text-sm text-ink/50">
          ← Kembali
        </Link>
        <p className="py-10 text-center text-sm text-ink/40">Jurnal tidak ditemukan.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <Link href="/jurnal" className="text-sm text-ink/50">
          ← Kembali
        </Link>
        <form action={deleteJournalAction}>
          <input type="hidden" name="id" value={entry.id as string} />
          <button className="text-xs font-medium text-rose-500 hover:underline">
            Hapus
          </button>
        </form>
      </header>
      <p className="text-xs text-ink/45">{fmt(entry.created_at as string)}</p>
      {entry.title && (
        <h1 className="text-xl font-bold text-ink">{entry.title as string}</h1>
      )}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/85">
        {entry.body as string}
      </p>
    </main>
  );
}
