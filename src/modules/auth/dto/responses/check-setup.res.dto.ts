import { ApiProperty } from '@nestjs/swagger';

export class CheckSetupResDto {
  @ApiProperty({ example: false })
  isSetupCompleted: boolean;

  @ApiProperty({ example: 'ONBOARDING' })
  status: string;
}
