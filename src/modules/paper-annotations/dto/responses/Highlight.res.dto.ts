import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Highlight, HighlightColor } from '@prisma/client';

export class HighlightResDto {
  @ApiProperty({
    description: 'Highlight uuid',
    example: 'c1a9d9f1-4b21-4b99-8d22-347799777555',
  })
  id: string;

  @ApiProperty({
    description: 'paper uuid',
    example: 'c1a9d9f1-4b21-4b99-8d22-347799777555',
  })
  paperId: string;

  @ApiProperty({
    description: 'Highlight color',
    example: HighlightColor.BLUE,
  })
  color: HighlightColor;

  @ApiPropertyOptional({
    description: 'Note on the highlight',
    example: 'this means that machine learning is ...',
  })
  note: string | null;

  @ApiProperty({
    description: 'XPath expression for the start of the highlight',
    example: '/html/body/div[1]/p[2]',
  })
  xpathStart: string;

  @ApiProperty({
    description: 'XPath expression for the end of the highlight',
    example: '/html/body/div[1]/p[3]',
  })
  xpathEnd: string;

  @ApiProperty({
    description: 'Character offset within the start node',
    example: 5,
  })
  startOffset: number;

  @ApiProperty({
    description: 'Character offset within the end node',
    example: 42,
  })
  endOffset: number;

  @ApiProperty({
    description: 'The text selected by the user',
    example: 'machine learning is a subset of AI',
  })
  selectedText: string;

  @ApiPropertyOptional({
    description: 'Plain text version of the selection',
    example: 'machine learning is a subset of AI',
  })
  plainText: string | null;

  @ApiPropertyOptional({
    description: 'HTML content of the selection',
    example: '<em>machine learning</em> is a subset of AI',
  })
  htmlContent: string | null;

  @ApiPropertyOptional({
    description: 'Text immediately before the selection for context',
    example: 'In this paper, we argue that ',
  })
  contextBefore: string | null;

  @ApiPropertyOptional({
    description: 'Text immediately after the selection for context',
    example: ', which has many applications.',
  })
  contextAfter: string | null;

  @ApiPropertyOptional({
    description: 'First word of the selection',
    example: 'machine',
  })
  firstWord: string | null;

  @ApiPropertyOptional({
    description: 'Last word of the selection',
    example: 'AI',
  })
  lastWord: string | null;

  @ApiPropertyOptional({
    description: 'Number of words in the selection',
    example: 7,
  })
  selectedWordCount: number | null;

  @ApiPropertyOptional({
    description: 'Number of characters in the selection',
    example: 34,
  })
  selectedCharLength: number | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  constructor(partial: Partial<HighlightResDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(highlight: Highlight): HighlightResDto {
    return new HighlightResDto({
      id: highlight.id,
      paperId: highlight.paperId,
      color: highlight.color,
      note: highlight.note,
      xpathStart: highlight.xpathStart,
      xpathEnd: highlight.xpathEnd,
      startOffset: highlight.startOffset,
      endOffset: highlight.endOffset,
      selectedText: highlight.selectedText,
      plainText: highlight.plainText,
      htmlContent: highlight.htmlContent,
      contextBefore: highlight.contextBefore,
      contextAfter: highlight.contextAfter,
      firstWord: highlight.firstWord,
      lastWord: highlight.lastWord,
      selectedWordCount: highlight.selectedWordCount,
      selectedCharLength: highlight.selectedCharLength,
      createdAt: highlight.createdAt,
      updatedAt: highlight.updatedAt,
    });
  }
}
