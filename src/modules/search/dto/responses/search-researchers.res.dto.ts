import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResearcherSearchResDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174003' })
  id: string;

  @ApiPropertyOptional({ example: 'Alice Johnson' })
  fullName: string | null;

  @ApiProperty({ example: 'alice_j' })
  username: string;

  @ApiPropertyOptional({ example: 'PhD Student at MIT...' })
  bio: string | null;

  @ApiPropertyOptional({ example: 'MIT' })
  university: string | null;

  @ApiPropertyOptional({ example: 'USA' })
  country: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/alice.jpg' })
  photoUrl: string | null;

  @ApiProperty({ example: false })
  isFollowing: boolean;
}
