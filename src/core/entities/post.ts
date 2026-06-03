// Entitas domain murni untuk feed.
export interface Category {
  id: number;
  slug: string;
  name: string;
}

export interface FeedPost {
  id: string;
  body: string;
  crisisFlag: boolean;
  createdAt: string;
  categoryName: string;
  categorySlug: string;
  authorHandle: string;
  pelukCount: number;
  replyCount: number;
}
