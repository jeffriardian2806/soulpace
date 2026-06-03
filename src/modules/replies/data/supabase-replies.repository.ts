import type { SupabaseClient } from "@supabase/supabase-js";
import type { RepliesRepository } from "./replies.repository";
import type { Reply } from "@/core/entities/reply";
import type { CreateReplyInput } from "../domain/reply.types";

function mapReply(r: any): Reply {
  return {
    id: r.id,
    body: r.body,
    isSurvivorReply: r.is_survivor_reply,
    createdAt: r.created_at,
    authorHandle: r.profiles?.handle ?? "Anonim",
  };
}

export class SupabaseRepliesRepository implements RepliesRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listByPost(postId: string): Promise<Reply[]> {
    const { data, error } = await this.supabase
      .from("replies")
      .select("id, body, is_survivor_reply, created_at, profiles!inner(handle)")
      .eq("post_id", postId)
      .eq("status", "active")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapReply);
  }

  async getById(id: string): Promise<Reply | null> {
    const { data, error } = await this.supabase
      .from("replies")
      .select("id, body, is_survivor_reply, created_at, profiles!inner(handle)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapReply(data) : null;
  }

  async create(input: CreateReplyInput): Promise<void> {
    const { error } = await this.supabase.from("replies").insert({
      post_id: input.postId,
      author_id: input.authorId,
      body: input.body,
      is_survivor_reply: input.isSurvivor,
    });
    if (error) throw new Error(error.message);
  }

  async setStatus(id: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from("replies")
      .update({ status })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}
