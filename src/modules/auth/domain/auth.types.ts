// Tipe domain untuk auth — bebas framework.
export interface AuthUser {
  id: string;
  email: string | null;
  isAnonymous: boolean;
}

export interface Credentials {
  email: string;
  password: string;
}
