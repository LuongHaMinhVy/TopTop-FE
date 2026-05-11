import { UserInfo } from "./user";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  dateOfBirth?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  user: UserInfo | null;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
}

export type AuthType = "login" | "signup";
export type AuthMethod = "options" | "form";

export interface AuthMessageData {
  type: "AUTH_SUCCESS" | "AUTH_ERROR";
  data?: AuthResponse | UserInfo;
  error?: string;
}

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: AuthType;
}
