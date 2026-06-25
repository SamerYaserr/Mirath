import { PickType } from '@nestjs/swagger';
import { UserSettings } from '@prisma/client';
import { UserSettingsResDto } from './user-settings.res.dto';

export class ReadingSettingsResDto extends PickType(UserSettingsResDto, [
  'defaultReadingListVisibility',
  'annotationHighlightColors',
] as const) {
  static fromEntity(entity: UserSettings): ReadingSettingsResDto {
    return {
      defaultReadingListVisibility: entity.defaultReadingListVisibility
        ? 'PUBLIC'
        : 'PRIVATE',
      annotationHighlightColors: entity.annotationHighlightColors,
    };
  }
}
