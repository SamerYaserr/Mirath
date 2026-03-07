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

export interface RotateRefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}
