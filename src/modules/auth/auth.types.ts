import { UserStatus } from '@prisma/client';

export interface AuthUserPayload {
  id: string;
  email: string;
  username: string;
  photoUrl: string | null;
  status: UserStatus;
}

export interface AuthSessionResult {
  message: string;
  user: AuthUserPayload;
  accessToken: string;
  refreshToken: string;
}

export interface SignupUserPayload {
  id: string;
  email: string;
  username: string;
  status: UserStatus;
}

export interface SignupResult {
  message: string;
  data: {
    user: SignupUserPayload;
  };
}

export interface ForgetPasswordResult {
  message: string;
}

export interface VerifyResetCodeResult {
  resetToken: string;
}

export interface ResetPasswordResult {
  message: string;
}

export interface ResendVerificationResult {
  message: string;
}

export interface CheckVerificationResult {
  isVerified: boolean;
  status: UserStatus;
}

export interface CheckSetupResult {
  isSetupCompleted: boolean;
  status: UserStatus;
}

export interface RotateRefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}
