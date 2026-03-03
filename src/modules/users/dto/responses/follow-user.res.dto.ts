import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';

type FollowUserEntity = Pick<
  User,
  | 'id'
  | 'username'
  | 'fullName'
  | 'photoUrl'
  | 'bio'
  | 'role'
  | 'status'
  | 'isPremium'
>;

export class FollowUserResDto {
  @ApiProperty({
    description: 'User UUID',
    example: 'aab521c1-564a-4783-a4aa-f694ee49f290',
  })
  id: string;

  @ApiProperty({ example: 'johndoe123' })
  username: string;

  @ApiProperty({ example: 'John Doe', nullable: true })
  fullName: string | null;

  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/v1/profile.jpg',
    nullable: true,
  })
  photoUrl: string | null;

  @ApiProperty({
    example: 'Passionate researcher and software engineer specializing in AI.',
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({ example: 'USER' })
  role: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: false })
  isPremium: boolean;

  @ApiProperty({
    description: 'Whether the viewer is following this user',
    example: true,
  })
  isFollowing: boolean;

  static fromEntity(
    user: FollowUserEntity,
    isFollowing: boolean,
  ): FollowUserResDto {
    const dto = new FollowUserResDto();

    dto.id = user.id;
    dto.username = user.username;
    dto.fullName = user.fullName;
    dto.photoUrl = user.photoUrl;
    dto.bio = user.bio;
    dto.role = user.role;
    dto.status = user.status;
    dto.isPremium = user.isPremium;
    dto.isFollowing = isFollowing;

    return dto;
  }
}
