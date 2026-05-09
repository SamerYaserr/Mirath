import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResearcherResult } from '../../search.types';

import { LevelOfEducation } from '@prisma/client';

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

  @ApiPropertyOptional({
    enum: LevelOfEducation,
    example: LevelOfEducation.GRADUATE,
  })
  levelOfEducation?: LevelOfEducation | null;

  static fromResult(result: ResearcherResult): ResearcherSearchResDto {
    const dto = new ResearcherSearchResDto();
    dto.id = result.id;
    dto.fullName = result.fullName;
    dto.username = result.username;
    dto.bio = result.bio;
    dto.university = result.university;
    dto.country = result.country;
    dto.photoUrl = result.photoUrl;
    dto.isFollowing = result.followings.length > 0;
    dto.levelOfEducation = result.levelOfEducation;
    return dto;
  }
}
