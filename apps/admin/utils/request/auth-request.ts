// mirrors: com.back.auth.model.dto.request.LoginRequest
export interface LoginRequest {
  email:    string;
  password: string;
}

// mirrors: com.back.auth.model.dto.request.RegisterRequest
// Validation rules (for client-side hints):
//   username: 2–24 chars, pattern ^[a-zA-Z0-9._]+$
//   password: 8–20 chars, must contain upper, lower, digit, special char
export interface RegisterRequest {
  username:     string;
  email:        string;
  password:     string;
  dateOfBirth?: string; // ISO date string, e.g. "1999-07-15"
}

// mirrors: com.back.auth.model.dto.request.ResetPasswordRequest
export interface ResetPasswordRequest {
  token:       string;
  newPassword: string;
}
