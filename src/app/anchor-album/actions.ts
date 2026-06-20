"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const MAX_ITEMS = 7;

export type AnchorItem = {
  id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  signed_url: string | null;
};

export async function addAnchorPhotoAction(p: {
  storage_path: string;
  caption: string;
}): Promise<{ error: string | null; id?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Lo harus login dulu." };

  // Enforce max count server-side
  const { count } = await supabase
    .from("anchor_album_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= MAX_ITEMS) {
    return { error: `Limit ${MAX_ITEMS} foto sudah tercapai. Hapus 1 dulu kalau mau tambah.` };
  }

  // Validate path belongs to user
  const expectedPrefix = `${user.id}/`;
  if (!p.storage_path.startsWith(expectedPrefix)) {
    return { error: "Storage path invalid." };
  }

  const { data, error } = await supabase
    .from("anchor_album_items")
    .insert({
      user_id: user.id,
      storage_path: p.storage_path,
      caption: p.caption.trim() || null,
      sort_order: count ?? 0,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/anchor-album");
  revalidatePath("/profile");
  return { error: null, id: data?.id };
}

export async function deleteAnchorPhotoAction(p: {
  id: string;
  storage_path: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Lo harus login dulu." };

  // Delete storage file (RLS prevents other users)
  const { error: storageErr } = await supabase.storage
    .from("anchor-album")
    .remove([p.storage_path]);

  if (storageErr) {
    // Storage delete failed but continue ke DB delete (mungkin file udah ke-hapus manual)
    console.error("Storage delete:", storageErr);
  }

  // Delete DB row
  const { error } = await supabase
    .from("anchor_album_items")
    .delete()
    .eq("id", p.id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/anchor-album");
  revalidatePath("/profile");
  return { error: null };
}

export async function updateCaptionAction(p: {
  id: string;
  caption: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Lo harus login dulu." };

  const { error } = await supabase
    .from("anchor_album_items")
    .update({ caption: p.caption.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", p.id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/anchor-album");
  return { error: null };
}

export async function listAnchorPhotosAction(): Promise<AnchorItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("anchor_album_items")
    .select("id, storage_path, caption, sort_order")
    .eq("user_id", user.id)
    .order("sort_order");

  const items = (data ?? []) as Omit<AnchorItem, "signed_url">[];

  // Generate signed URLs (1 hour) untuk display
  const itemsWithUrl: AnchorItem[] = await Promise.all(
    items.map(async (item) => {
      const { data: urlData } = await supabase.storage
        .from("anchor-album")
        .createSignedUrl(item.storage_path, 3600);
      return { ...item, signed_url: urlData?.signedUrl ?? null };
    })
  );

  return itemsWithUrl;
}
