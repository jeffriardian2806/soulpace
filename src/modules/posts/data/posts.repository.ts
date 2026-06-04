import type { Category, FeedPost } from "@/core/entities/post";
import type { CreatePostInput, ListPostsOptions } from "../domain/post.types";

export interface PostsRepository {
  listCategories(): Promise<Category[]>;
  listPosts(opts: ListPostsOptions): Promise<FeedPost[]>;
  listPostsWithUserReactions(
    opts: ListPostsOptions,
    userId: string | null
  ): Promise<{ posts: FeedPost[]; pelukedIds: Set<string> }>;
  getPost(id: string): Promise<FeedPost | null>;
  listByAuthor(authorId: string): Promise<FeedPost[]>;
  createPost(input: CreatePostInput): Promise<void>;
  setStatus(id: string, status: string): Promise<void>;
  getPelukedPostIds(postIds: string[], userId: string | null): Promise<Set<string>>;
  addPeluk(postId: string, userId: string): Promise<void>;
  removePeluk(postId: string, userId: string): Promise<void>;
}
