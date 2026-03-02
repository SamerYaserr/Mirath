import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatedListResDto {
  @ApiProperty({ example: 'c1a9d9f1-4b21-4b99-8d22-347799777555' })
  id: string;

  @ApiProperty({ example: 'Machine Learning Favorites' })
  title: string;

  @ApiPropertyOptional({ example: 'A collection of papers on ML.' })
  description?: string;

  @ApiProperty({ example: true })
  isPublic: boolean;

  @ApiProperty({ example: 't4gvmte3-pppe-4crf-r333-9qfeqq15q7qq' })
  ownerId: string;

  @ApiProperty({ example: '2026-01-19T18:39:07.379Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-19T18:39:07.379Z' })
  updatedAt: Date;
}
