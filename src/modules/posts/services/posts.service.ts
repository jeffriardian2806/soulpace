import { ValidationError } from "@/core/errors";
import type { PostsRepository } from "../data/posts.repository";
import type { Category, FeedPost } from "@/core/entities/post";

const CRISIS_KEYWORDS = [
  "bunuh diri",
  "bundir",
  "gantung diri",
  "mengakhiri hidup",
  "ngakhirin hidup",
  "akhiri hidup",
  "akhirin hidup",
  "mengakhiri semuanya",
  "pengen mati",
  "pengin mati",
  "pgn mati",
  "ingin mati",
  "mau mati",
  "mati aja",
  "lebih baik mati",
  "mending mati",
  "baik mati",
  "gak mau hidup",
  "ga mau hidup",
  "nggak mau hidup",
  "ga sanggup hidup",
  "gak sanggup hidup",
  "ga kuat hidup",
  "capek hidup",
  "lelah hidup",
  "capek idup",
  "pergi selamanya",
  "menghilang selamanya",
  "menyakiti diri",
  "melukai diri",
  "nyakitin diri",
  "lukain diri",
  "menyayat",
  "nyayat",
  "self harm",
  "selfharm",
  "overdosis",
];

export class PostsService {
  constructor(private readonly repo: PostsRepository) {}

  detectCrisis(body: string): boolean {
    const t = body.toLowerCase();
    return CRISIS_KEYWORDS.some((k) => t.includes(k));
  }

  listCategories(): Promise<Category[]> {
    return this.repo.listCategories();
  }

  async getFeed(opts: { categorySlug?: string }): Promise<{
    categories: Category[];
    posts: FeedPost[];
  }> {
    const categories = await this.repo.listCategories();
    const cat = opts.categorySlug
      ? categories.find((c) => c.slug === opts.categorySlug)
      : undefined;
    const posts = await this.repo.listPosts({
      categoryId: cat?.id,
      limit: 20,
      offset: 0,
    });
    return { categories, posts };
  }

  async feedPage(
    categorySlug: string | undefined,
    offset: number,
    limit: number,
    userId: string | null = null,
    onlyUnanswered = false,
    wish?: string
  ): Promise<{ posts: FeedPost[]; peluked: string[] }> {
    let categoryId: number | undefined;
    if (categorySlug) {
      const categories = await this.repo.listCategories();
      categoryId = categories.find((c) => c.slug === categorySlug)?.id;
    }
    const { posts, pelukedIds } = await this.repo.listPostsWithUserReactions(
      { categoryId, limit, offset, onlyUnanswered, wish },
      userId
    );
    return { posts, peluked: [...pelukedIds] };
  }

  getPost(id: string): Promise<FeedPost | null> {
    return this.repo.getPost(id);
  }

  listByAuthor(authorId: string): Promise<FeedPost[]> {
    return this.repo.listByAuthor(authorId);
  }

  async createPost(
    authorId: string,
    categoryId: number | null,
    body: string,
    mood: string | null = null,
    wish: string | null = null
  ): Promise<void> {
    const text = body.trim();
    if (text.length < 1 || text.length > 5000) {
      throw new ValidationError("Curhat harus antara 1 sampai 5000 karakter.");
    }
    await this.repo.createPost({
      authorId,
      categoryId: categoryId ?? null,
      body: text,
      crisisFlag: this.detectCrisis(text),
      mood,
      wish,
    });
  }

  setStatus(id: string, status: string): Promise<void> {
    return this.repo.setStatus(id, status);
  }

  pelukedIds(postIds: string[], userId: string | null): Promise<Set<string>> {
    return this.repo.getPelukedPostIds(postIds, userId);
  }

  async togglePeluk(
    postId: string,
    userId: string,
    currentlyPeluked: boolean
  ): Promise<void> {
    if (currentlyPeluked) await this.repo.removePeluk(postId, userId);
    else await this.repo.addPeluk(postId, userId);
  }
}
