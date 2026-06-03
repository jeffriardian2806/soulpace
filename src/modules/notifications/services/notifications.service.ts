import type { NotificationsRepository } from "../data/notifications.repository";
import type { AppNotification } from "@/core/entities/notification";

export class NotificationsService {
  constructor(private readonly repo: NotificationsRepository) {}

  list(userId: string): Promise<AppNotification[]> {
    return this.repo.listForUser(userId);
  }

  unreadCount(userId: string): Promise<number> {
    return this.repo.unreadCount(userId);
  }

  markAllRead(userId: string): Promise<void> {
    return this.repo.markAllRead(userId);
  }
}
