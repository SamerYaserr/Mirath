import { ApiProperty } from '@nestjs/swagger';
import { UserResDto } from './user.res.dto';
import { AuthUserPayload } from '../../auth.types';

export class LoginDataResDto {
  @ApiProperty({ type: UserResDto })
  user: UserResDto;

  @ApiProperty({ example: 'eyJhbGciOi...' })
  accessToken: string;

  static fromAuthData(
    user: AuthUserPayload,
    accessToken: string,
  ): LoginDataResDto {
    const dto = new LoginDataResDto();
    dto.user = UserResDto.fromPayload(user);
    dto.accessToken = accessToken;
    return dto;
  }
}
