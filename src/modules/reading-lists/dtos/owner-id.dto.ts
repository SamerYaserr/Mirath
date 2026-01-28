import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class OwnerIdDto {
  @ApiPropertyOptional({
    description: 'Owner Id to filter reading lists by',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID must be a valid UUID' })
  ownerId?: string;
}
