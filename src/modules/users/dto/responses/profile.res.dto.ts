import { ApiProperty } from '@nestjs/swagger';
import { FieldOfStudy, Interest, User } from '@prisma/client';

export type FormattedProfileWithMeta = Partial<User> & {
  interests: Partial<Interest>[];
  fieldsOfStudy: Partial<FieldOfStudy>[];
  followersCount: number;
  followingCount: number;
  isMe: boolean;
  isFollowing: boolean;
};

class SummarizedInterestResDto {
  @ApiProperty({ example: '1f1b22e3-aa0a-4769-8816-ab88f21e4ed6' })
  id: string;

  @ApiProperty({ example: 'Artificial Intelligence' })
  name: string;
}

class FieldOfStudyResDto {
  @ApiProperty({ example: 'uuid-123' })
  id: string;

  @ApiProperty({ example: 'Computer Science' })
  name: string;
}

export class ProfileResDto {
  @ApiProperty({
    description: 'User UUID',
    example: 'aab521c1-564a-4783-a4aa-f694ee49f290',
  })
  id: string;

  @ApiProperty({ example: 'johndoe123' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({
    description: 'Email is hidden if privacy settings restrict it',
    example: 'john.doe@example.com',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/v1/profile.jpg',
    nullable: true,
  })
  photoUrl: string | null;

  @ApiProperty({
    example: 'Passionate researcher and software engineer.',
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({ example: 'Canada' })
  country: string;

  @ApiProperty({
    example: '1995-06-15',
    nullable: true,
    format: 'date',
  })
  birthDate: Date | null;

  @ApiProperty({ example: 'GRADUATE' })
  levelOfEducation: string;

  @ApiProperty({ example: 'University of Toronto' })
  university: string;

  @ApiProperty({ example: 'USER' })
  role: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: false })
  isEmailVisible: boolean;

  @ApiProperty({ example: false })
  isPremium: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ description: 'Number of followers', example: 120 })
  followersCount: number;

  @ApiProperty({ description: 'Number of users following', example: 15 })
  followingCount: number;

  @ApiProperty({
    description: 'Is the requester the owner of this profile?',
    example: false,
  })
  isMe: boolean;

  @ApiProperty({
    description: 'Is the requester following this user?',
    example: true,
  })
  isFollowing: boolean;

  @ApiProperty({ type: [SummarizedInterestResDto] })
  interests: SummarizedInterestResDto[];

  @ApiProperty({ type: [FieldOfStudyResDto] })
  fieldsOfStudy: FieldOfStudyResDto[];

  static fromDomain(data: FormattedProfileWithMeta): ProfileResDto {
    const dto = new ProfileResDto();

    dto.id = data.id!;
    dto.username = data.username!;
    dto.fullName = data.fullName!;
    dto.email = data.email || null;
    dto.photoUrl = data.photoUrl || null;
    dto.bio = data.bio || null;
    dto.birthDate = data.birthDate || null;
    dto.country = data.country!;
    dto.levelOfEducation = data.levelOfEducation!;
    dto.university = data.university!;
    dto.role = data.role!;
    dto.status = data.status!;
    dto.isEmailVisible = data.isEmailVisible!;
    dto.isPremium = data.isPremium!;
    dto.createdAt = data.createdAt!;
    dto.updatedAt = data.updatedAt!;

    dto.followersCount = data.followersCount || 0;
    dto.followingCount = data.followingCount || 0;
    dto.isMe = data.isMe;
    dto.isFollowing = data.isFollowing;

    dto.interests = (data.interests || []).map((i) => ({
      id: i.id!,
      name: i.name!,
    }));
    dto.fieldsOfStudy = (data.fieldsOfStudy || []).map((f) => ({
      id: f.id!,
      name: f.name!,
    }));

    return dto;
  }
}
