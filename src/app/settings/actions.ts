"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfilesService } from "@/modules/profiles";
import { DomainError } from "@/core/errors";

export type HandleState = { error: string | null; ok: boolean };

export async function updateHandleAction(
  _prev: HandleState,
  formData: FormData
): Promise<HandleState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const handle = String(formData.get("handle") ?? "");
  try {
    const svc = await getProfilesService();
    await svc.changeHandle(user.id, handle);
  } catch (e) {
    return {
      error: e instanceof DomainError ? e.message : "Gagal mengubah handle.",
      ok: false,
    };
  }
  revalidatePath("/settings");
  revalidatePath("/feed");
  return { error: null, ok: true };
}

export async function toggleSurvivorAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const value = formData.get("value") === "1";
  const svc = await getProfilesService();
  await svc.setSurvivor(user.id, value);
  revalidatePath("/settings");
}
