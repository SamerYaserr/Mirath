import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailResDto {
  @ApiProperty({ example: 'eyJhbGciOi...' })
  accessToken: string;
}
