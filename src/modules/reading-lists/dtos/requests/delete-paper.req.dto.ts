import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class DeletePaperReqDto {
  @ApiProperty({
    description: 'ID of the reading list',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsNotEmpty({ message: 'ID is required in the request params' })
  @IsUUID('4', { message: 'ID must be a valid UUID' })
  id: string;

  @ApiProperty({
    description: 'ID of the paper to remove',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsNotEmpty({ message: 'paperId is required in the request params' })
  @IsUUID('4', { message: 'paperId must be a valid UUID' })
  paperId: string;
}
