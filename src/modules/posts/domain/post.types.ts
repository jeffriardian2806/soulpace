export interface CreatePostInput {
  authorId: string;
  categoryId: number | null;
  body: string;
  crisisFlag: boolean;
  mood?: string | null;
  wish?: string | null;
}

export interface ListPostsOptions {
  categoryId?: number;
  limit: number;
  offset: number;
  onlyUnanswered?: boolean;
  wish?: string;
}
