import { PickType } from '@nestjs/swagger';
import { UserSettings } from '@prisma/client';
import { UserSettingsResDto } from './user-settings.res.dto';

export class DisplaySettingsResDto extends PickType(UserSettingsResDto, [
  'colorMode',
  'defaultFontSize',
] as const) {
  static fromEntity(entity: UserSettings): DisplaySettingsResDto {
    return {
      colorMode: entity.colorMode,
      defaultFontSize: entity.defaultFontSize,
    };
  }
}
