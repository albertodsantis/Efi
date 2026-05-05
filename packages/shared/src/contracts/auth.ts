export interface GoogleAuthUrlResponse {
  url: string;
}

export interface AuthStatusResponse {
  connected: boolean;
}

export interface LogoutResponse {
  success: boolean;
}

export interface DeleteAccountResponse {
  success: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  referralCode?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type Locale = 'es' | 'en';

export const SUPPORTED_LOCALES: readonly Locale[] = ['es', 'en'] as const;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: 'email' | 'google';
  plan: 'free' | 'pro';
  trialEndsAt: string | null;
  subscribedUntil: string | null;
  earlyAccess: boolean;
  locale: Locale;
}

export interface UpdateLocaleRequest {
  locale: Locale;
}

export interface UpdateLocaleResponse {
  success: boolean;
  locale: Locale;
}

export interface MeResponse {
  user: SessionUser | null;
  isNew?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  updatedProvider: 'email' | 'google';
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
  currentPassword?: string;
}

export interface SimpleSuccessResponse {
  success: boolean;
}
