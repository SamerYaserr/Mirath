import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Shared author shape used in discussions and reading lists
export class SearchUserResDto {
  @ApiProperty({ example: 'user-uuid' })
  id: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  fullName: string | null;

  @ApiProperty({ example: 'jane_d' })
  username: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  photoUrl: string | null;

  @ApiProperty({ example: false })
  isMe: boolean;

  @ApiProperty({ example: true })
  isFollowing: boolean;
}

// Search history entry
export class SearchHistoryEntryResDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'machine learning' })
  query: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  userId: string;

  @ApiProperty({ example: '2026-01-12T10:00:00.000Z' })
  createdAt: Date;
}
