import { IsNotEmpty, IsString } from 'class-validator';

import { RequestEmailChangeReqDto } from './request-email-change.req.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmEmailReqDto extends RequestEmailChangeReqDto {
  @ApiProperty({
    description: 'The OTP sent to the new email address for confirmation',
    example: '305630',
  })
  @IsString({ message: 'OTP must be a string' })
  @IsNotEmpty({ message: 'OTP cannot be empty' })
  otp: string;
}
