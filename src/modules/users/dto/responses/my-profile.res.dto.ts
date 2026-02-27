import { OmitType } from '@nestjs/swagger';
import { ProfileResDto } from './profile.res.dto';

export class MyProfileResDto extends OmitType(ProfileResDto, [
  'isMe',
  'isFollowing',
] as const) {}
