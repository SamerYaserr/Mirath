import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface TokenResult {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateAuthTokens(
    userId: string,
    email: string,
    refreshTokenId: string,
    sessionId: string,
  ): Promise<TokenResult> {
    const payload = { sub: userId, email };

    const refreshPayload = {
      sub: userId,
      email,
      jti: refreshTokenId,
      sid: sessionId,
    };

    const accessMinutes = this.configService.get<number>(
      'JWT_ACCESS_EXPIRATION_MINUTES',
      15,
    );
    const refreshDays = this.configService.get<number>(
      'JWT_REFRESH_EXPIRATION_DAYS',
      7,
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: `${accessMinutes}m`,
        secret: this.configService.get<string>('JWT_ACCESS_SECRET')!,
      }),
      this.jwtService.signAsync(refreshPayload, {
        expiresIn: `${refreshDays}d`,
        secret: this.configService.get<string>('JWT_REFRESH_SECRET')!,
      }),
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

  async verifyRefreshToken(token: string): Promise<{
    jti: string;
    sub: string;
    sid: string;
    email: string;
  }> {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET')!;
    return await this.jwtService.verifyAsync(token, { secret });
  }

  async verifyResetToken(token: string): Promise<{
    userId: string;
    forPasswordReset: boolean;
  }> {
    try {
      const secret = this.configService.get<string>('JWT_RESET_SECRET')!;
      console.log(secret);
      return await this.jwtService.verifyAsync(token, { secret });
    } catch {
      throw new ForbiddenException('Reset token is invalid or expired');
    }
  }

  getRefreshTokenExpiresAt(): Date {
    const refreshDays = this.configService.get<number>(
      'JWT_REFRESH_EXPIRATION_DAYS',
      7,
    );
    return new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
  }
}
