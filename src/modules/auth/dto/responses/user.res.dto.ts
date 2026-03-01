import { ApiProperty } from '@nestjs/swagger';

export class UserResDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'user123' })
  username: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg', required: false })
  photoUrl?: string | null;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;
}
