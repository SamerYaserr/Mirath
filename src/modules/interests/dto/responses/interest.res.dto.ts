import { ApiProperty } from '@nestjs/swagger';

export class InterestResDto {
  @ApiProperty({
    description: 'Unique identifier of the interest',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the interest',
    example: 'Physics',
  })
  name: string;

  @ApiProperty({
    description: 'Whether the interest is user-created',
    example: false,
  })
  custom: boolean;

  @ApiProperty({
    description: 'Timestamp when the interest was created',
    example: '2025-12-10T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the interest was last updated',
    example: '2025-12-10T10:30:00.000Z',
  })
  updatedAt: Date;
}
