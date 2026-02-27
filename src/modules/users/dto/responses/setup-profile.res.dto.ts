import { ApiProperty } from '@nestjs/swagger';

export class SetupProfileResDto {
  @ApiProperty({
    description: 'User UUID',
    example: 'aab521c1-564a-4783-a4aa-f694ee49f290',
  })
  id: string;

  @ApiProperty({ example: 'johndoe123' })
  username: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe', nullable: true })
  fullName: string | null;

  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/v1/profile.jpg',
    nullable: true,
  })
  photoUrl: string | null;

  @ApiProperty({ example: null, nullable: true })
  bio: string | null;

  @ApiProperty({
    example: null,
    nullable: true,
    format: 'date',
  })
  birthDate: Date | null;

  @ApiProperty({ example: null, nullable: true })
  country: string | null;

  @ApiProperty({ example: 'GRADUATE', nullable: true })
  levelOfEducation: string | null;

  @ApiProperty({ example: 'Harvard University', nullable: true })
  university: string | null;

  @ApiProperty({ example: 'USER' })
  role: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: false })
  isEmailVisible: boolean;

  @ApiProperty({ example: false })
  isPremium: boolean;

  @ApiProperty({ format: 'date-time', example: '2025-12-10T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time', example: '2025-12-10T10:35:00.000Z' })
  updatedAt: Date;
}
