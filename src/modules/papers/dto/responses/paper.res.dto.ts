import { ApiProperty } from '@nestjs/swagger';

export interface PaperData {
  id: string;
  citation: string;
  title: string;
  abstract: string;
  authors: string[];
  categories: string[];
  publishedAt: Date;
  content: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class PaperResDto {
  @ApiProperty({
    description: 'Paper UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Citation reference for the paper',
    example:
      'Smith, J. et al. (2025). Advances in AI Research. Journal of AI, 10(2), 45-67.',
  })
  citation: string;

  @ApiProperty({
    description: 'Title of the paper',
    example: 'Advances in Artificial Intelligence: A Comprehensive Survey',
  })
  title: string;

  @ApiProperty({
    description: 'Abstract of the paper',
    example:
      'This paper presents a comprehensive survey of recent advances in artificial intelligence, covering deep learning, natural language processing, and computer vision...',
  })
  abstract: string;

  @ApiProperty({
    description: 'List of authors',
    example: ['John Smith', 'Jane Doe', 'Robert Johnson'],
    type: [String],
  })
  authors: string[];

  @ApiProperty({
    description: 'Categories/topics the paper belongs to',
    example: ['Artificial Intelligence', 'Machine Learning', 'Deep Learning'],
    type: [String],
  })
  categories: string[];

  @ApiProperty({
    description: 'Publication date of the paper',
    example: '2025-06-15T00:00:00.000Z',
  })
  publishedAt: Date;

  @ApiProperty({
    description: 'Full content of the paper as an array of HTML strings',
    example: [
      '<html><head><link rel="stylesheet" href="https://arxiv.org/static/browse/0.3.4/css/arxiv-html-papers.css"></head><div class="ltx_page_main">',
      '<div class="ltx_page_content">',
      '<article class="ltx_document ltx_authors_1line">',
      '<h1 class="ltx_title ltx_title_document">Advances in Artificial Intelligence: A Comprehensive Survey</h1>',
      '<div class="ltx_authors"><span class="ltx_creator ltx_role_author"><span class="ltx_personname">John Smith</span></span></div>',
      '<section class="ltx_section"><h2 class="ltx_title ltx_title_section">1. Introduction</h2><p>...</p></section>',
    ],
  })
  content: Record<string, unknown>;

  @ApiProperty({
    description: 'Timestamp when the paper was added to the system',
    example: '2025-12-10T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the paper was last updated',
    example: '2025-12-15T14:20:00.000Z',
  })
  updatedAt: Date;

  static fromDomain(data: PaperData): PaperResDto {
    const dto = new PaperResDto();

    dto.id = data.id;
    dto.citation = data.citation;
    dto.title = data.title;
    dto.abstract = data.abstract;
    dto.authors = data.authors;
    dto.categories = data.categories;
    dto.publishedAt = data.publishedAt;
    dto.content = data.content;
    dto.createdAt = data.createdAt;
    dto.updatedAt = data.updatedAt;

    return dto;
  }
}
