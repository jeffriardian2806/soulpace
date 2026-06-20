import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SafetyPlanView } from "@/components/safety-plan/SafetyPlanView";
import { getSafetyPlanAction } from "../actions";

export const metadata = {
  title: "Daftar Aman — Crisis Mode",
  description: "Tap to call. Lo aman sekarang.",
};

export default async function SafetyPlanCrisisPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/safety-plan/crisis");

  const data = await getSafetyPlanAction();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between gap-3">
        <Link href="/safety-plan" className="text-sm text-ink/50">← Edit Daftar Aman</Link>
        <Link href="/main" className="text-sm text-ink/50">Main</Link>
      </header>
      <SafetyPlanView data={data} crisisMode={true} />
    </main>
  );
}
