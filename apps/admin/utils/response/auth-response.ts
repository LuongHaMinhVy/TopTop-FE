import type { UserInfo } from "./user-info";

export type AuthResponse = {
  user: UserInfo | null;
}