import { ApiProperty } from '@nestjs/swagger';
import { ColorMode, FontSize, UserSettings } from '@prisma/client';

export class UserSettingsResDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  userId: string;

  @ApiProperty({ example: true })
  showRecommendedPapers: boolean;

  @ApiProperty({ example: false })
  hideAlreadyReadPapers: boolean;

  @ApiProperty({ example: true })
  saveSearchHistory: boolean;

  @ApiProperty({ enum: ColorMode, example: ColorMode.SYSTEM })
  colorMode: ColorMode;

  @ApiProperty({ enum: FontSize, example: FontSize.MEDIUM })
  defaultFontSize: FontSize;

  @ApiProperty({
    description: 'Default visibility for new reading lists.',
    enum: ['PUBLIC', 'PRIVATE'],
    example: 'PUBLIC',
  })
  defaultReadingListVisibility: 'PUBLIC' | 'PRIVATE';

  @ApiProperty({ type: [String], example: ['#FFDD57', '#48C78E'] })
  annotationHighlightColors: string[];

  @ApiProperty({ example: true })
  notifyNewPapersInField: boolean;

  @ApiProperty({ example: true })
  notifyReadingListActivity: boolean;

  @ApiProperty({ example: true })
  notifyNewFollowers: boolean;

  @ApiProperty({ example: true })
  notifyDiscussionReplies: boolean;

  @ApiProperty({ example: true })
  notifyCommentMentions: boolean;

  @ApiProperty({ example: true })
  notifyVotesOnContent: boolean;

  @ApiProperty({ example: false })
  isPrivateAccount: boolean;

  @ApiProperty({ example: true })
  allowProfileSearch: boolean;

  @ApiProperty({ example: true })
  allowPublicComments: boolean;

  @ApiProperty({ example: true })
  useReadingBehaviorForRecommendations: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  constructor(partial: Partial<UserSettingsResDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(entity: UserSettings): UserSettingsResDto {
    return new UserSettingsResDto({
      id: entity.id,
      userId: entity.userId,
      showRecommendedPapers: entity.showRecommendedPapers,
      hideAlreadyReadPapers: entity.hideAlreadyReadPapers,
      saveSearchHistory: entity.saveSearchHistory,
      colorMode: entity.colorMode,
      defaultFontSize: entity.defaultFontSize,
      defaultReadingListVisibility: entity.defaultReadingListVisibility
        ? 'PUBLIC'
        : 'PRIVATE',
      annotationHighlightColors: entity.annotationHighlightColors,
      notifyNewPapersInField: entity.notifyNewPapersInField,
      notifyReadingListActivity: entity.notifyReadingListActivity,
      notifyNewFollowers: entity.notifyNewFollowers,
      notifyDiscussionReplies: entity.notifyDiscussionReplies,
      notifyCommentMentions: entity.notifyCommentMentions,
      notifyVotesOnContent: entity.notifyVotesOnContent,
      isPrivateAccount: entity.isPrivateAccount,
      allowProfileSearch: entity.allowProfileSearch,
      allowPublicComments: entity.allowPublicComments,
      useReadingBehaviorForRecommendations:
        entity.useReadingBehaviorForRecommendations,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
