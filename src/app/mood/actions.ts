"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// date = "YYYY-MM-DD" (tanggal lokal user), mood = 1..5
export async function saveMoodAction(
  date: string,
  mood: number,
  note: string
): Promise<{ ok: boolean }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || mood < 1 || mood > 5) {
    return { ok: false };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("mood_entries").upsert(
    {
      user_id: user.id,
      entry_date: date,
      mood,
      note: note.trim() ? note.trim().slice(0, 500) : null,
    },
    { onConflict: "user_id,entry_date" }
  );
  if (error) return { ok: false };
  revalidatePath("/mood");
  return { ok: true };
}
