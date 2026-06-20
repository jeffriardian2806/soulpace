"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Contact = { name: string; phone: string; note?: string };
export type ProfessionalContact = { name: string; phone: string; type: string };

export type SafetyPlanPayload = {
  warning_signs: string[];
  internal_strategies: string[];
  distraction_contacts: Contact[];
  help_contacts: Contact[];
  professional_contacts: ProfessionalContact[];
  means_restriction: string[];
  is_complete: boolean;
};

export async function saveSafetyPlanAction(p: SafetyPlanPayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Lo harus login dulu." };

  // Clean — strip empty entries
  const cleanStr = (arr: string[]) => arr.map(s => s.trim()).filter(s => s.length > 0);
  const cleanContact = (arr: Contact[]) => arr.filter(c => c.name?.trim() && c.phone?.trim()).map(c => ({
    name: c.name.trim(), phone: c.phone.trim(), note: c.note?.trim() || undefined,
  }));
  const cleanProf = (arr: ProfessionalContact[]) => arr.filter(c => c.name?.trim() && c.phone?.trim()).map(c => ({
    name: c.name.trim(), phone: c.phone.trim(), type: c.type || "other",
  }));

  const row = {
    user_id: user.id,
    warning_signs: cleanStr(p.warning_signs),
    internal_strategies: cleanStr(p.internal_strategies),
    distraction_contacts: cleanContact(p.distraction_contacts),
    help_contacts: cleanContact(p.help_contacts),
    professional_contacts: cleanProf(p.professional_contacts),
    means_restriction: cleanStr(p.means_restriction),
    is_complete: p.is_complete,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("safety_plans")
    .upsert(row, { onConflict: "user_id" });

  if (error) return { error: error.message };
  revalidatePath("/safety-plan");
  revalidatePath("/safety-plan/crisis");
  revalidatePath("/profile");
  return { error: null };
}

export async function getSafetyPlanAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("safety_plans")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}
