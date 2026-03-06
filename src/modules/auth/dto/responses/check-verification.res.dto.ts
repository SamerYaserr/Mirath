import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class CheckVerificationResDto {
  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;
}
