import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterDeviceTokenReqDto {
  @ApiProperty({
    description: 'The device token to register for push notifications',
    example: 'eKWJXmgxxx...ZoEHfH',
    required: true,
  })
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token must not be empty' })
  token: string;

  @ApiProperty({
    description: 'Optional device ID associated with the token',
    example: 'device-id-123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Device ID must be a string' })
  @MaxLength(128, { message: 'Device ID must not exceed 128 characters' })
  deviceId?: string | undefined;
}
