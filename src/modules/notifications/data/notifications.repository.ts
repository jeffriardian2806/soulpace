import type { AppNotification } from "@/core/entities/notification";

export interface NotificationsRepository {
  listForUser(userId: string): Promise<AppNotification[]>;
  unreadCount(userId: string): Promise<number>;
  markAllRead(userId: string): Promise<void>;
}
