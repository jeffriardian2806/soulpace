import type { Reply } from "@/core/entities/reply";
import type { CreateReplyInput } from "../domain/reply.types";

export interface RepliesRepository {
  listByPost(postId: string): Promise<Reply[]>;
  getById(id: string): Promise<Reply | null>;
  create(input: CreateReplyInput): Promise<void>;
  setStatus(id: string, status: string): Promise<void>;
}
