export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  permissions?: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
}