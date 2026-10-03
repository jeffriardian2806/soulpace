import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FeedbackForm } from "@/components/FeedbackForm";
import { createFeedbackAction } from "./actions";

export const metadata = { title: "Kritik & Saran — Soulpace" };

export default async function MasukanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/feed" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">Kritik &amp; Saran</h1>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Gimana pengalamanmu pakai Soulpace? Kasih bintang dan ceritain. Masukanmu privat — cuma
        tim yang baca.
      </p>
      <FeedbackForm action={createFeedbackAction} />
    </main>
  );
}
