import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LevelOfEducation, Role, UserStatus } from '@prisma/client';

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

  @ApiProperty({
    description: 'User email address',
    example: 'johndoe@example.com',
  })
  email: string;

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

  @ApiPropertyOptional({
    description: 'Date of birth',
    nullable: true,
    example: '1995-06-15',
  })
  birthDate: Date | null;

  @ApiPropertyOptional({
    description: 'Country of the user',
    nullable: true,
    example: 'Egypt',
  })
  country: string | null;

  @ApiPropertyOptional({
    description: 'Level of education',
    nullable: true,
    enum: LevelOfEducation,
    example: LevelOfEducation.GRADUATE,
  })
  levelOfEducation: LevelOfEducation | null;

  @ApiPropertyOptional({
    description: 'University name',
    nullable: true,
    example: 'Cairo University',
  })
  university: string | null;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    example: Role.USER,
  })
  role: Role;

  @ApiProperty({
    description: 'Account status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'Whether the user email is publicly visible',
    example: false,
  })
  isEmailVisible: boolean;

  @ApiProperty({
    description: 'Whether the user has a premium subscription',
    example: false,
  })
  isPremium: boolean;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-15T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-15T10:00:00.000Z',
  })
  updatedAt: Date;
}
