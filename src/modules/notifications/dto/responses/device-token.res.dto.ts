import { ApiProperty } from '@nestjs/swagger';

export class RegisterDeviceTokenResDto {
  @ApiProperty({
    description: 'Unique identifier of the device token',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description:
      'Firebase or platform-specific device token for push notifications',
    example: 'eKWJXmgxxx...ZoEHfH',
  })
  token: string;

  @ApiProperty({
    description: 'Unique device identifier from the client',
    example: 'device-123e4567-e89b-12d3',
    required: false,
  })
  deviceId?: string | undefined;

  @ApiProperty({
    description: 'Timestamp when the device token was last updated',
    example: '2026-07-02T10:30:00.000Z',
  })
  updatedAt: string;

  static fromEntity(entity: {
    id: string;
    token: string;
    deviceId?: string | null;
    updatedAt: Date;
  }): RegisterDeviceTokenResDto {
    const dto = new RegisterDeviceTokenResDto();

    dto.id = entity.id;
    dto.token = entity.token;
    dto.deviceId = entity.deviceId ?? undefined;
    dto.updatedAt = entity.updatedAt.toISOString();

    return dto;
  }
}
