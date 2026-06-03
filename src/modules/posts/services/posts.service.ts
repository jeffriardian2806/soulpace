import { ValidationError } from "@/core/errors";
import type { PostsRepository } from "../data/posts.repository";
import type { Category, FeedPost } from "@/core/entities/post";

const CRISIS_KEYWORDS = [
  "bunuh diri",
  "mengakhiri hidup",
  "ngakhirin hidup",
  "pengen mati",
  "ingin mati",
  "gak mau hidup",
  "ga mau hidup",
  "menyakiti diri",
  "melukai diri",
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

  getPost(id: string): Promise<FeedPost | null> {
    return this.repo.getPost(id);
  }

  listByAuthor(authorId: string): Promise<FeedPost[]> {
    return this.repo.listByAuthor(authorId);
  }

  async createPost(
    authorId: string,
    categoryId: number,
    body: string
  ): Promise<void> {
    const text = body.trim();
    if (text.length < 1 || text.length > 5000) {
      throw new ValidationError("Curhat harus antara 1 sampai 5000 karakter.");
    }
    if (!categoryId) {
      throw new ValidationError("Pilih kategori dulu ya.");
    }
    await this.repo.createPost({
      authorId,
      categoryId,
      body: text,
      crisisFlag: this.detectCrisis(text),
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
