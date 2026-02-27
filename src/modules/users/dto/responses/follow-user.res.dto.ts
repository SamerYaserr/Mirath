import { ApiProperty } from '@nestjs/swagger';

export class FollowUserResDto {
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
}
