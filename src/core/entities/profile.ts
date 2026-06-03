export type Role = "user" | "moderator";

export interface Profile {
  id: string;
  handle: string;
  isSurvivor: boolean;
  role: Role;
  handleChangedAt: string | null;
  createdAt: string;
}
