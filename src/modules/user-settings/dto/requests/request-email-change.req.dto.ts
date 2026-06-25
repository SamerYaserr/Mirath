import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestEmailChangeReqDto {
  @ApiProperty({
    description: 'The new email address to change to',
    example: 'student@university.edu',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  newEmail: string;
}
