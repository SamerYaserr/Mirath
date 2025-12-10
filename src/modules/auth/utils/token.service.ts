import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface TokenResult {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  sub: string;
  email?: string;
}

export interface RefreshTokenPayload extends TokenPayload {
  jti: string;
  sid: string;
}

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signAccessToken(payload: TokenPayload): Promise<string> {
    const accessMinutes = this.configService.get<number>(
      'JWT_ACCESS_EXPIRATION_MINUTES',
      15,
    );

    return this.jwtService.signAsync(payload, {
      expiresIn: `${accessMinutes}m`,
      secret: this.configService.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  async signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
    const refreshDays = this.configService.get<number>(
      'JWT_REFRESH_EXPIRATION_DAYS',
      7,
    );

    return this.jwtService.signAsync(payload, {
      expiresIn: `${refreshDays}d`,
      secret: this.configService.get<string>('JWT_REFRESH_SECRET')!,
    });
  }

  async generateAuthTokens(
    userId: string,
    email: string,
    refreshTokenId: string,
    sessionId: string,
  ): Promise<TokenResult> {
    const accessTokenPayload = { sub: userId, email };

    const refreshTokenPayload = {
      sub: userId,
      email,
      jti: refreshTokenId,
      sid: sessionId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(accessTokenPayload),
      this.signRefreshToken(refreshTokenPayload),
    ]);

    return { accessToken, refreshToken };
  }

  async generateResetToken(payload: object) {
    const secret = this.configService.get<string>('JWT_RESET_SECRET');
    const expiresIn = this.configService.get<string>(
      'JWT_RESET_EXPIRATION_MINUTES',
    );

    return await this.jwtService.signAsync(payload, {
      secret,
      expiresIn: `${expiresIn}m`,
    } as JwtSignOptions);
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET')!;
    return await this.jwtService.verifyAsync(token, { secret });
  }

  async verifyResetToken(token: string): Promise<{
    userId: string;
    forPasswordReset: boolean;
  }> {
    try {
      const secret = this.configService.get<string>('JWT_RESET_SECRET')!;
      return await this.jwtService.verifyAsync(token, { secret });
    } catch {
      throw new ForbiddenException('Reset token is invalid or expired');
    }
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET')!;
    return await this.jwtService.verifyAsync(token, { secret });
  }

  getRefreshTokenExpiresAt(): Date {
    const refreshDays = this.configService.get<number>(
      'JWT_REFRESH_EXPIRATION_DAYS',
      7,
    );
    return new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
  }
}
