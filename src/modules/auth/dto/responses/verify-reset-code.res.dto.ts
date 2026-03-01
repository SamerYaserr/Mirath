import { ApiProperty } from '@nestjs/swagger';

export class VerifyResetCodeResDto {
  @ApiProperty({ example: 'd8f9b6a1-2c3d-4e5f-9876-abcdef123456' })
  resetToken: string;
}
