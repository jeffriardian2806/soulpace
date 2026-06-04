"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthService } from "@/modules/auth";
import { createClient } from "@/lib/supabase/server";
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

  // Kalau email confirmation OFF, signUp langsung bikin sesi -> user udah login.
  // Kalau ON, belum ada sesi -> tampilkan "cek email".
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  revalidatePath("/", "layout");
  if (user) {
    redirect("/welcome");
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
