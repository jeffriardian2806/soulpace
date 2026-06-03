import { ValidationError } from "@/core/errors";
import type { RepliesRepository } from "../data/replies.repository";
import type { Reply } from "@/core/entities/reply";

export class RepliesService {
  constructor(private readonly repo: RepliesRepository) {}

  listByPost(postId: string): Promise<Reply[]> {
    return this.repo.listByPost(postId);
  }

  getReply(id: string): Promise<Reply | null> {
    return this.repo.getById(id);
  }

  setStatus(id: string, status: string): Promise<void> {
    return this.repo.setStatus(id, status);
  }

  async create(
    authorId: string,
    postId: string,
    body: string,
    isSurvivor: boolean
  ): Promise<void> {
    const text = body.trim();
    if (text.length < 1 || text.length > 3000) {
      throw new ValidationError("Balasan harus antara 1 sampai 3000 karakter.");
    }
    await this.repo.create({ postId, authorId, body: text, isSurvivor });
  }
}
