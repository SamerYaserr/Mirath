import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Comment } from '@prisma/client';

export class CommentResDto {
  @ApiProperty({
    description: 'Unique identifier of the comment',
    example: '770e8400-e29b-41d4-a716-446655440777',
  })
  id: string;

  @ApiProperty({
    description: 'Content of the comment',
    example: 'This is a great point!',
  })
  content: string;

  @ApiProperty({
    description: 'Number of upvotes',
    example: 0,
  })
  upvoteCount: number;

  @ApiProperty({
    description: 'Number of downvotes',
    example: 0,
  })
  downvoteCount: number;

  @ApiProperty({
    description: 'ID of the comment author',
    example: 'a1b2c3d4-e5f6-4a5b-b5c6-d7e8f9a0b1c2',
  })
  authorId: string;

  @ApiProperty({
    description: 'ID of the discussion this comment belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  discussionId: string;

  @ApiPropertyOptional({
    description: 'ID of the parent comment (null for top-level comments)',
    nullable: true,
    example: null,
  })
  parentId: string | null;

  @ApiProperty({
    description: 'Comment creation date',
    example: '2024-01-15T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Comment last update date',
    example: '2024-01-15T12:00:00.000Z',
  })
  updatedAt: Date;

  static fromEntity(comment: Comment): CommentResDto {
    return Object.assign(new CommentResDto(), {
      ...comment,
    });
  }
}
