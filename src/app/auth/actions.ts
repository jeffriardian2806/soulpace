"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthService } from "@/modules/auth";
import { DomainError } from "@/core/errors";

// Step 1: kirim kode 6 digit ke email. Dipakai buat masuk maupun daftar.
export async function sendOtpAction(email: string): Promise<{ error: string | null }> {
  try {
    const auth = await getAuthService();
    await auth.requestOtp(email);
  } catch (e) {
    return { error: e instanceof DomainError ? e.message : "Terjadi kesalahan." };
  }
  return { error: null };
}

// Step 2: cek kode. Sukses -> sesi kebentuk (cookie) -> ke /feed.
export async function verifyOtpAction(
  email: string,
  token: string
): Promise<{ error: string | null }> {
  try {
    const auth = await getAuthService();
    await auth.verifyOtp(email, token);
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
