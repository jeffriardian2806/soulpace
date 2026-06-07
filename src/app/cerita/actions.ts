"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPostsService } from "@/modules/posts";

async function detectCrisis(text: string): Promise<boolean> {
  const svc = await getPostsService();
  return svc.detectCrisis(text);
}

export async function createStoryAction(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const cw = String(formData.get("content_warning") ?? "").trim();
  if (!title || !body) return { error: "Judul & isi wajib diisi." };

  // Anti dobel-submit: cek apakah user baru aja submit story dengan judul sama dalam 30 detik
  const tenSecAgo = new Date(Date.now() - 30_000).toISOString();
  const { data: recent } = await supabase
    .from("stories")
    .select("id")
    .eq("author_id", user.id)
    .eq("title", title.slice(0, 200))
    .gte("created_at", tenSecAgo)
    .limit(1)
    .maybeSingle();
  if (recent) {
    redirect(`/cerita/${recent.id}`);
  }

  const summary = body.replace(/\s+/g, " ").slice(0, 180);

  const { data, error } = await supabase
    .from("stories")
    .insert({
      author_id: user.id,
      title: title.slice(0, 200),
      summary,
      content_warning: cw ? cw.slice(0, 200) : null,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Gagal nyimpen cerita. Coba lagi." };

  await supabase.from("story_episodes").insert({
    story_id: data.id,
    author_id: user.id,
    episode_number: 1,
    title: "",
    body: body.slice(0, 20000),
    crisis_flag: await detectCrisis(body),
  });

  revalidatePath("/cerita");
  revalidatePath("/feed");
  redirect(`/cerita/${data.id}`);
}

export async function addEpisodeAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const storyId = String(formData.get("story_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!storyId || !body) redirect(`/cerita/${storyId}/tulis`);

  // hanya pemilik cerita
  const { data: story } = await supabase
    .from("stories")
    .select("author_id")
    .eq("id", storyId)
    .maybeSingle();
  if (!story || story.author_id !== user.id) redirect(`/cerita/${storyId}`);

  const { data: last } = await supabase
    .from("story_episodes")
    .select("episode_number")
    .eq("story_id", storyId)
    .order("episode_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextNumber = (last?.episode_number ?? 0) + 1;

  await supabase.from("story_episodes").insert({
    story_id: storyId,
    author_id: user.id,
    episode_number: nextNumber,
    title: title.slice(0, 200),
    body: body.slice(0, 20000),
    crisis_flag: await detectCrisis(body),
  });

  revalidatePath(`/cerita/${storyId}`);
  redirect(`/cerita/${storyId}`);
}

export async function commentStoryAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const storyId = String(formData.get("story_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!storyId || !body) redirect(`/cerita/${storyId}`);

  await supabase.from("story_comments").insert({
    story_id: storyId,
    author_id: user.id,
    body: body.slice(0, 2000),
    crisis_flag: await detectCrisis(body),
  });
  revalidatePath(`/cerita/${storyId}`);
}

export async function pelukStoryAction(
  storyId: string,
  currentlyPeluked: boolean
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (currentlyPeluked) {
    await supabase
      .from("story_peluk")
      .delete()
      .eq("story_id", storyId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("story_peluk")
      .insert({ story_id: storyId, user_id: user.id });
  }
  revalidatePath(`/cerita/${storyId}`);
}

export async function deleteStoryAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from("stories").delete().eq("id", id);
  revalidatePath("/cerita");
  redirect("/cerita");
}

export async function updateStoryAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const cw = String(formData.get("content_warning") ?? "").trim();
  if (!id || !title) redirect(`/cerita/${id}/edit`);

  // RLS memastikan hanya pemilik yang bisa update
  await supabase
    .from("stories")
    .update({
      title: title.slice(0, 200),
      content_warning: cw ? cw.slice(0, 200) : null,
    })
    .eq("id", id);

  revalidatePath(`/cerita/${id}`);
  revalidatePath("/cerita");
  revalidatePath("/feed");
  redirect(`/cerita/${id}`);
}

export async function updateEpisodeAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const episodeId = String(formData.get("episode_id") ?? "");
  const storyId = String(formData.get("story_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!episodeId || !body) redirect(`/cerita/${storyId}/${episodeId}/edit`);

  const { data: ep } = await supabase
    .from("story_episodes")
    .select("episode_number")
    .eq("id", episodeId)
    .maybeSingle();

  // RLS memastikan hanya pemilik yang bisa update
  await supabase
    .from("story_episodes")
    .update({
      title: title.slice(0, 200),
      body: body.slice(0, 20000),
      crisis_flag: await detectCrisis(body),
    })
    .eq("id", episodeId);

  // kalau episode 1, sinkronkan ringkasan preview cerita
  if (ep?.episode_number === 1) {
    await supabase
      .from("stories")
      .update({ summary: body.replace(/\s+/g, " ").slice(0, 180) })
      .eq("id", storyId);
  }

  revalidatePath(`/cerita/${storyId}`);
  revalidatePath(`/cerita/${storyId}/${episodeId}`);
  revalidatePath("/cerita");
  revalidatePath("/feed");
  redirect(`/cerita/${storyId}/${episodeId}`);
}

export async function toggleStoryReactionAction(
  storyId: string,
  kind: string,
  active: boolean
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!["pernah", "sedang", "lewat", "belajar"].includes(kind)) {
    return { error: "Reaksi tidak valid." };
  }
  if (active) {
    const { error } = await supabase
      .from("story_reactions")
      .delete()
      .eq("story_id", storyId)
      .eq("user_id", user.id)
      .eq("kind", kind);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("story_reactions")
      .insert({ story_id: storyId, user_id: user.id, kind });
    if (error && !/duplicate|unique/i.test(error.message)) return { error: error.message };
  }
  return { error: null };
}
