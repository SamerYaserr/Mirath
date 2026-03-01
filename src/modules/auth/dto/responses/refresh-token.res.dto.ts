import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenResDto {
  @ApiProperty({ example: 'Tokens refreshed successfully.' })
  message: string;

  @ApiProperty({ example: 'eyJhbGciOi...' })
  accessToken: string;
}
