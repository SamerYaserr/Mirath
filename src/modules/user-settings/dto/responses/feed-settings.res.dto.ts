import { ApiProperty } from '@nestjs/swagger';
import { UserSettings } from '@prisma/client';

export class FeedSettingsResDto {
  @ApiProperty({ example: true })
  showRecommendedPapers: boolean;

  @ApiProperty({ example: false })
  hideAlreadyReadPapers: boolean;

  @ApiProperty({ example: true })
  saveSearchHistory: boolean;

  static fromEntity(settings: UserSettings | null): FeedSettingsResDto {
    return {
      showRecommendedPapers: settings?.showRecommendedPapers ?? true,
      hideAlreadyReadPapers: settings?.hideAlreadyReadPapers ?? false,
      saveSearchHistory: settings?.saveSearchHistory ?? true,
    };
  }
}
