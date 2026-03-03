import { Interest } from '@prisma/client';
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

  static fromEntity(interest: Interest): InterestResDto {
    const dto = new InterestResDto();

    dto.id = interest.id;
    dto.name = interest.name;
    dto.custom = interest.custom;

    return dto;
  }
}
