import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenResDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      'The short-lived JWT Access Token used for authenticating subsequent API requests.',
  })
  accessToken: string;

  static fromToken(accessToken: string): AccessTokenResDto {
    const dto = new AccessTokenResDto();
    dto.accessToken = accessToken;
    return dto;
  }
}

export class ResetTokenResDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The short-lived JWT Token used for resetting user passwords.',
  })
  resetToken: string;

  static fromToken(resetToken: string): ResetTokenResDto {
    const dto = new ResetTokenResDto();
    dto.resetToken = resetToken;
    return dto;
  }
}
