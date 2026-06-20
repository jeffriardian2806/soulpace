import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkPremiumAccess } from "@/components/PremiumGate";
import { SafetyPlanForm } from "@/components/safety-plan/SafetyPlanForm";
import { getSafetyPlanAction } from "./actions";

export const metadata = {
  title: "Daftar Aman — Soulpace",
  description: "Safety Plan ala Stanley-Brown — emergency kit yang lo siapin di moment tenang.",
};

export default async function SafetyPlanPage() {
  const _blocked_ = await checkPremiumAccess("safety-plan");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/safety-plan");

  const existing = await getSafetyPlanAction();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-sm text-ink/50">← Profile</Link>
          <h1 className="text-lg font-bold text-ink">🛟 Daftar Aman</h1>
        </div>
        {existing?.is_complete && (
          <Link href="/safety-plan/crisis" className="rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white">
            🆘 Buka Crisis Mode
          </Link>
        )}
      </header>

      <SafetyPlanForm initialData={existing ?? undefined} />
    </main>
  );
}
