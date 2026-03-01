import { ApiProperty } from '@nestjs/swagger';
import { UserResDto } from './user.res.dto';

export class GoogleAuthResDto {
  @ApiProperty({ example: 'Authentication successful' })
  message: string;

  @ApiProperty({ type: UserResDto })
  user: UserResDto;

  @ApiProperty({ example: 'eyJhbGciOi...' })
  accessToken: string;
}
