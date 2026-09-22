// Authentication Request/Response Types
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ApiError {
  error: string;
  details?: string;
}

// Service Layer Types
export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  marketingEmails?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PasswordResetData {
  email: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SocialUserData {
  name: string;
  email: string;
  image?: string;
  provider: string;
  providerId: string;
  accessToken?: string;
  refreshToken?: string;
}