export type NotificationType = "peluk" | "reply";

export interface AppNotification {
  id: string;
  type: NotificationType;
  actorHandle: string | null;
  postId: string | null;
  read: boolean;
  createdAt: string;
}
