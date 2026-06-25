import { ApiProperty } from '@nestjs/swagger';
import { ColorMode, FontSize, UserSettings } from '@prisma/client';

export class UserSettingsResDto {
  @ApiProperty({
    description: 'Unique identifier for the settings record.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the user these settings belong to.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  userId: string;

  @ApiProperty({
    description:
      'When enabled, AI-powered recommended papers are shown in the feed.',
    example: true,
  })
  showRecommendedPapers: boolean;

  @ApiProperty({
    description:
      'When enabled, papers the user has already read are hidden from the feed.',
    example: false,
  })
  hideAlreadyReadPapers: boolean;

  @ApiProperty({
    description: 'When enabled, the user search queries are saved to history.',
    example: true,
  })
  saveSearchHistory: boolean;

  @ApiProperty({
    description: 'Preferred color mode for the application UI.',
    enum: ColorMode,
    example: ColorMode.SYSTEM,
  })
  colorMode: ColorMode;

  @ApiProperty({
    description: 'Preferred font size for reading papers.',
    enum: FontSize,
    example: FontSize.MEDIUM,
  })
  defaultFontSize: FontSize;

  @ApiProperty({
    description:
      'Default visibility applied to newly created reading lists. PUBLIC means visible to everyone, PRIVATE means visible only to the owner.',
    enum: ['PUBLIC', 'PRIVATE'],
    example: 'PUBLIC',
  })
  defaultReadingListVisibility: 'PUBLIC' | 'PRIVATE';

  @ApiProperty({
    description:
      'List of custom hex color codes used for annotation highlights.',
    type: [String],
    example: ['#FFDD57', '#48C78E'],
  })
  annotationHighlightColors: string[];

  @ApiProperty({
    description:
      'When enabled, the user receives notifications when new papers are published in their fields of interest.',
    example: true,
  })
  notifyNewPapersInField: boolean;

  @ApiProperty({
    description:
      'When enabled, the user receives notifications about activity on their reading lists (e.g. someone saved a list).',
    example: true,
  })
  notifyReadingListActivity: boolean;

  @ApiProperty({
    description:
      'When enabled, the user receives notifications when someone follows them.',
    example: true,
  })
  notifyNewFollowers: boolean;

  @ApiProperty({
    description:
      'When enabled, the user receives notifications when someone replies to their discussions.',
    example: true,
  })
  notifyDiscussionReplies: boolean;

  @ApiProperty({
    description:
      'When enabled, the user receives notifications when they are mentioned in a comment.',
    example: true,
  })
  notifyCommentMentions: boolean;

  @ApiProperty({
    description:
      'When enabled, the user receives notifications when their discussions or comments receive votes.',
    example: true,
  })
  notifyVotesOnContent: boolean;

  @ApiProperty({
    description:
      'When enabled, the account is private and only approved followers can see the full profile.',
    example: false,
  })
  isPrivateAccount: boolean;

  @ApiProperty({
    description: 'When enabled, the user profile can appear in search results.',
    example: true,
  })
  allowProfileSearch: boolean;

  @ApiProperty({
    description:
      'When enabled, other users can post public comments on the user profile.',
    example: true,
  })
  allowPublicComments: boolean;

  @ApiProperty({
    description:
      'When enabled, the user reading behavior (viewed papers, time spent) is used to improve AI recommendations.',
    example: true,
  })
  useReadingBehaviorForRecommendations: boolean;

  @ApiProperty({
    description: 'Timestamp when the settings record was first created.',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the settings record was last updated.',
    example: '2024-01-15T10:30:00.000Z',
  })
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
