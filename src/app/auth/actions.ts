"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthService } from "@/modules/auth";
import { DomainError } from "@/core/errors";

export type FormState = { error: string | null; success?: boolean };

export async function registerAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    const auth = await getAuthService();
    await auth.register(email, password);
  } catch (e) {
    return { error: e instanceof DomainError ? e.message : "Terjadi kesalahan." };
  }
  return { error: null, success: true };
}

export async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    const auth = await getAuthService();
    await auth.login(email, password);
  } catch (e) {
    return { error: e instanceof DomainError ? e.message : "Terjadi kesalahan." };
  }
  revalidatePath("/", "layout");
  redirect("/feed");
}

export async function guestAction(): Promise<void> {
  const auth = await getAuthService();
  await auth.loginAsGuest();
  revalidatePath("/", "layout");
  redirect("/feed");
}
