import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SearchHistoryRecord, UserSource } from '../../search.types';

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

  static fromSource(user: UserSource, currentUserId: string): SearchUserResDto {
    const dto = new SearchUserResDto();
    dto.id = user.id;
    dto.fullName = user.fullName;
    dto.username = user.username;
    dto.photoUrl = user.photoUrl;
    dto.isMe = user.id === currentUserId;
    dto.isFollowing = user.followers.length > 0;
    return dto;
  }
}

export class SearchHistoryEntryResDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'machine learning' })
  query: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  userId: string;

  @ApiProperty({ example: '2026-01-12T10:00:00.000Z' })
  createdAt: Date;

  static fromRecord(record: SearchHistoryRecord): SearchHistoryEntryResDto {
    const dto = new SearchHistoryEntryResDto();
    dto.id = record.id;
    dto.query = record.query;
    dto.userId = record.userId;
    dto.createdAt = record.createdAt;
    return dto;
  }
}
