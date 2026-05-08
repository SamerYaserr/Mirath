import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthorResDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 'a1b2c3d4-e5f6-4a5b-b5c6-d7e8f9a0b1c2',
  })
  id: string;

  @ApiProperty({
    description: 'Unique username',
    example: 'johndoe',
  })
  username: string;

  @ApiPropertyOptional({
    description: 'Full name of the user',
    nullable: true,
    example: 'John Doe',
  })
  fullName: string | null;

  @ApiPropertyOptional({
    description: 'URL of the user profile photo',
    nullable: true,
    example: 'https://example.com/avatar.jpg',
  })
  photoUrl: string | null;

  @ApiPropertyOptional({
    description: 'Short biography of the user',
    nullable: true,
    example: 'AI Researcher',
  })
  bio: string | null;

  @ApiProperty({
    description: 'Whether the user has a premium subscription',
    example: false,
  })
  isPremium: boolean;

  @ApiProperty({
    description: 'Whether this author is the currently authenticated user',
    example: false,
  })
  isMe: boolean;

  @ApiProperty({
    description: 'Whether the currently authenticated user follows this author',
    example: false,
  })
  isFollowing: boolean;
}
