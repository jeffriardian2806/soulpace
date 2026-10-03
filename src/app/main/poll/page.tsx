import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PollWidget } from "@/components/PollWidget";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Polling Hari Ini — Soulpace" };

export default async function PollPage() {
  const _blocked_ = await checkPremiumAccess("poll");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data: poll } = await supabase
    .from("polls")
    .select("id, question, options")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let voted: number | null = null;
  let counts: Record<string, number> = {};
  let total = 0;
  if (poll) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: v } = await supabase
        .from("poll_votes")
        .select("option_index")
        .eq("poll_id", poll.id)
        .eq("user_id", user.id)
        .maybeSingle();
      voted = v ? v.option_index : null;
    }
    const { data: res } = await supabase.rpc("poll_results", { p_poll_id: poll.id });
    if (res) {
      total = (res as { total: number }).total ?? 0;
      counts = ((res as { counts: Record<string, number> }).counts) ?? {};
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Main</Link>
        <h1 className="text-lg font-bold text-ink">📊 Polling Hari Ini</h1>
      </header>
      {poll ? (
        <PollWidget
          poll={poll as { id: string; question: string; options: string[] }}
          initialVoted={voted}
          initialCounts={counts}
          initialTotal={total}
        />
      ) : (
        <p className="py-10 text-center text-sm text-ink/40">Belum ada polling aktif. Cek lagi nanti ya.</p>
      )}
    </main>
  );
}
