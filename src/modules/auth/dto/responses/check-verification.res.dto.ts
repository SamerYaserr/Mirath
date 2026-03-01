import { ApiProperty } from '@nestjs/swagger';

export class CheckVerificationResDto {
  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;
}
