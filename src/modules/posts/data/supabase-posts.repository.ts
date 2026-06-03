import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostsRepository } from "./posts.repository";
import type { Category, FeedPost } from "@/core/entities/post";
import type { CreatePostInput, ListPostsOptions } from "../domain/post.types";

const POST_SELECT =
  "id, body, crisis_flag, created_at, categories!inner(name, slug), profiles!inner(handle), reactions(count), replies(count)";

function mapPost(r: any): FeedPost {
  return {
    id: r.id,
    body: r.body,
    crisisFlag: r.crisis_flag,
    createdAt: r.created_at,
    categoryName: r.categories?.name ?? "",
    categorySlug: r.categories?.slug ?? "",
    authorHandle: r.profiles?.handle ?? "Anonim",
    pelukCount: r.reactions?.[0]?.count ?? 0,
    replyCount: r.replies?.[0]?.count ?? 0,
  };
}

export class SupabasePostsRepository implements PostsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from("categories")
      .select("id, slug, name")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as Category[];
  }

  async listPosts(opts: ListPostsOptions): Promise<FeedPost[]> {
    let q = this.supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(opts.offset, opts.offset + opts.limit - 1);
    if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPost);
  }

  async getPost(id: string): Promise<FeedPost | null> {
    const { data, error } = await this.supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("id", id)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapPost(data) : null;
  }

  async listByAuthor(authorId: string): Promise<FeedPost[]> {
    const { data, error } = await this.supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("author_id", authorId)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPost);
  }

  async createPost(input: CreatePostInput): Promise<void> {
    const { error } = await this.supabase.from("posts").insert({
      author_id: input.authorId,
      category_id: input.categoryId,
      body: input.body,
      crisis_flag: input.crisisFlag,
    });
    if (error) throw new Error(error.message);
  }

  async setStatus(id: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from("posts")
      .update({ status })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async getPelukedPostIds(
    postIds: string[],
    userId: string | null
  ): Promise<Set<string>> {
    if (!userId || postIds.length === 0) return new Set();
    const { data, error } = await this.supabase
      .from("reactions")
      .select("post_id")
      .eq("user_id", userId)
      .in("post_id", postIds);
    if (error) throw new Error(error.message);
    return new Set((data ?? []).map((r: any) => r.post_id as string));
  }

  async addPeluk(postId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("reactions")
      .insert({ post_id: postId, user_id: userId });
    if (error && !/duplicate|unique/i.test(error.message)) {
      throw new Error(error.message);
    }
  }

  async removePeluk(postId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  }
}
