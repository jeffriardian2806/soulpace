import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkPremiumAccess } from "@/components/PremiumGate";
import { getSafetyPlanAction } from "@/app/safety-plan/actions";
import { listAnchorPhotosAction } from "@/app/anchor-album/actions";
import { CrisisCompanion } from "@/components/crisis-mode/CrisisCompanion";

export const metadata = {
  title: "Crisis Mode — Soulpace",
  description: "Companion mode untuk moment yang berat.",
};

type Contact = { name: string; phone: string; note?: string };
type ProfessionalContact = { name: string; phone: string; type: string };

type SafetyPlanRow = {
  warning_signs?: string[] | null;
  internal_strategies?: string[] | null;
  distraction_contacts?: Contact[] | null;
  help_contacts?: Contact[] | null;
  professional_contacts?: ProfessionalContact[] | null;
  means_restriction?: string[] | null;
  is_complete?: boolean | null;
};

export default async function CrisisModePage() {
  const _blocked_ = await checkPremiumAccess("crisis-mode");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/crisis-mode");

  const [planRow, anchorPhotos] = await Promise.all([
    getSafetyPlanAction(),
    listAnchorPhotosAction(),
  ]);

  const plan = planRow as SafetyPlanRow | null;

  const safetyPlan = plan ? {
    help_contacts: (plan.help_contacts ?? []) as Contact[],
    professional_contacts: (plan.professional_contacts ?? []) as ProfessionalContact[],
    means_restriction: (plan.means_restriction ?? []) as string[],
    internal_strategies: (plan.internal_strategies ?? []) as string[],
    is_complete: plan.is_complete ?? false,
  } : null;

  return (
    <CrisisCompanion
      safetyPlan={safetyPlan}
      anchorPhotos={anchorPhotos.map(p => ({ signed_url: p.signed_url, caption: p.caption }))}
    />
  );
}
