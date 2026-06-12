import { ValidationError } from "@/core/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostsRepository } from "./posts.repository";
import type { Category, FeedPost } from "@/core/entities/post";
import type { CreatePostInput, ListPostsOptions } from "../domain/post.types";

const POST_SELECT =
  "id, body, crisis_flag, created_at, mood, wish, edited_at, author_id, categories(name, slug), profiles!inner(handle), reactions(count), replies(count)";

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
    mood: r.mood ?? null,
    wish: r.wish ?? null,
    authorId: r.author_id,
    editedAt: r.edited_at ?? null,
  };
}

export class SupabasePostsRepository implements PostsRepository {
  private categoryCache: { data: Category[]; timestamp: number } | null = null;
  private readonly CACHE_TTL = 3600000; // 1 jam — bantu dedup listCategories dalam 1 request

  constructor(private readonly supabase: SupabaseClient) {}

  async listCategories(): Promise<Category[]> {
    const now = Date.now();
    if (this.categoryCache && now - this.categoryCache.timestamp < this.CACHE_TTL) {
      return this.categoryCache.data;
    }
    const { data, error } = await this.supabase
      .from("categories")
      .select("id, slug, name")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw new Error(error.message);
    const categories = (data ?? []) as Category[];
    this.categoryCache = { data: categories, timestamp: now };
    return categories;
  }

  async listPosts(opts: ListPostsOptions): Promise<FeedPost[]> {
    let q = this.supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(opts.offset, opts.offset + opts.limit - 1);
    if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
    if (opts.onlyUnanswered) q = q.eq("reply_count", 0);
    if (opts.wish) q = q.eq("wish", opts.wish);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPost);
  }

  async listPostsWithUserReactions(
    opts: ListPostsOptions,
    userId: string | null
  ): Promise<{ posts: FeedPost[]; pelukedIds: Set<string> }> {
    let q = this.supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(opts.offset, opts.offset + opts.limit - 1);
    if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
    if (opts.onlyUnanswered) q = q.eq("reply_count", 0);
    if (opts.wish) q = q.eq("wish", opts.wish);

    const { data: postsData, error: postsError } = await q;
    if (postsError) throw new Error(postsError.message);

    const posts = (postsData ?? []).map(mapPost);
    const postIds = posts.map((p) => p.id);

    let pelukedIds = new Set<string>();
    if (userId && postIds.length > 0) {
      const { data: reactionsData, error: reactionsError } = await this.supabase
        .from("reactions")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds);
      if (reactionsError) throw new Error(reactionsError.message);
      pelukedIds = new Set(
        (reactionsData ?? []).map((r: any) => r.post_id as string)
      );
    }

    return { posts, pelukedIds };
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
      category_id: input.categoryId ?? null,
      body: input.body,
      crisis_flag: input.crisisFlag,
      mood: input.mood ?? null,
      wish: input.wish ?? null,
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

  async updatePost(
    postId: string,
    userId: string,
    input: { body: string; mood: string | null; wish: string | null; crisisFlag: boolean }
  ): Promise<void> {
    // SECURITY: cek owner + window 15 menit + belum ada reply
    const { data: row, error: gerr } = await this.supabase
      .from("posts")
      .select("author_id, created_at, reply_count")
      .eq("id", postId)
      .maybeSingle();
    if (gerr) throw gerr;
    if (!row) throw new ValidationError("Curhat tidak ditemukan.");
    if (row.author_id !== userId) throw new ValidationError("Bukan curhat kamu.");
    const ageMin = (Date.now() - new Date(row.created_at).getTime()) / 60000;
    if (ageMin > 15) throw new ValidationError("Sudah lewat batas edit (15 menit).");
    if ((row.reply_count ?? 0) > 0) throw new ValidationError("Sudah ada balasan, ga bisa diedit lagi.");

    const { error } = await this.supabase
      .from("posts")
      .update({
        body: input.body,
        mood: input.mood,
        wish: input.wish,
        crisis_flag: input.crisisFlag,
        edited_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("author_id", userId);
    if (error) throw error;
  }

  async getPostForEdit(
    postId: string,
    userId: string
  ): Promise<{
    body: string; mood: string | null; wish: string | null;
    createdAt: string; replyCount: number; authorId: string;
  } | null> {
    const { data, error } = await this.supabase
      .from("posts")
      .select("body, mood, wish, created_at, reply_count, author_id")
      .eq("id", postId)
      .maybeSingle();
    if (error) throw error;
    if (!data || data.author_id !== userId) return null;
    return {
      body: data.body, mood: data.mood ?? null, wish: data.wish ?? null,
      createdAt: data.created_at, replyCount: data.reply_count ?? 0, authorId: data.author_id,
    };
  }
}
