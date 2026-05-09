import { ApiProperty } from '@nestjs/swagger';

export class SearchResultResDto {
  @ApiProperty({
    description: 'Paper UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the paper',
    example: 'Quantum Computing Advances',
  })
  title: string;

  @ApiProperty({
    description: 'Truncated abstract of the paper (max 200 characters)',
    example: 'In this paper we discuss recent advances in quantum computing...',
  })
  abstract: string;

  @ApiProperty({
    description: 'Publication date of the paper',
    example: '2025-01-01T00:00:00.000Z',
  })
  publishedAt: Date;

  @ApiProperty({
    description: 'Whether the paper is saved by the current user',
    example: true,
  })
  isSaved: boolean;

  @ApiProperty({
    description: 'List of tags associated with the paper',
    example: ['quantum computing', 'advances'],
  })
  categories: string[];

  @ApiProperty({
    description: 'List of authors of the paper',
    example: ['Alice Smith', 'Bob Johnson'],
  })
  authors: string[];

  static fromEntity(searchResult: Record<string, any>): SearchResultResDto {
    const dto = new SearchResultResDto();
    dto.id = searchResult.id;
    dto.title = searchResult.title;
    dto.isSaved = searchResult.isSaved;
    dto.abstract = searchResult.abstract;
    dto.publishedAt = searchResult.publishedAt;
    dto.categories = searchResult.categories;
    dto.authors = searchResult.authors;
    return dto;
  }
}
