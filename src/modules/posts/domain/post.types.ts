export interface CreatePostInput {
  authorId: string;
  categoryId: number;
  body: string;
  crisisFlag: boolean;
}

export interface ListPostsOptions {
  categoryId?: number;
  limit: number;
  offset: number;
}
