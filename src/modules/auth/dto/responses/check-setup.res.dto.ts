import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class CheckSetupResDto {
  @ApiProperty({ example: false })
  isSetupCompleted: boolean;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ONBOARDING })
  status: UserStatus;
}
