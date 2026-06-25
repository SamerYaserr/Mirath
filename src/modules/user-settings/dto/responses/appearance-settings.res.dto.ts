import { PickType } from '@nestjs/swagger';
import { ColorMode, FontSize, UserSettings } from '@prisma/client';
import { UserSettingsResDto } from './user-settings.res.dto';

export class AppearanceSettingsResDto extends PickType(UserSettingsResDto, [
  'colorMode',
  'defaultFontSize',
  'defaultReadingListVisibility',
  'annotationHighlightColors',
]) {
  static fromEntity(entity: UserSettings | null): AppearanceSettingsResDto {
    return {
      colorMode: entity?.colorMode ?? ColorMode.SYSTEM,
      defaultFontSize: entity?.defaultFontSize ?? FontSize.MEDIUM,
      defaultReadingListVisibility:
        (entity?.defaultReadingListVisibility ?? true) ? 'PUBLIC' : 'PRIVATE',
      annotationHighlightColors: entity?.annotationHighlightColors ?? [],
    };
  }
}
