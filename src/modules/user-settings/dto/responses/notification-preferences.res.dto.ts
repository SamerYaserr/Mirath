import { ApiProperty } from '@nestjs/swagger';
import { UserSettings } from '@prisma/client';

class ResearchPreferencesDto {
  @ApiProperty({ example: true })
  newPapersInField: boolean;

  @ApiProperty({ example: true })
  readingListActivity: boolean;
}

class SocialPreferencesDto {
  @ApiProperty({ example: true })
  newFollowers: boolean;

  @ApiProperty({ example: true })
  discussionReplies: boolean;

  @ApiProperty({ example: true })
  commentMentions: boolean;

  @ApiProperty({ example: true })
  votesOnContent: boolean;
}

class SystemPreferencesDto {
  @ApiProperty({
    example: true,
    description: 'Always true. Security alerts are always enabled.',
  })
  securityAlerts: boolean;
}

export class NotificationPreferencesResDto {
  @ApiProperty({ type: () => ResearchPreferencesDto })
  research: ResearchPreferencesDto;

  @ApiProperty({ type: () => SocialPreferencesDto })
  social: SocialPreferencesDto;

  @ApiProperty({ type: () => SystemPreferencesDto })
  system: SystemPreferencesDto;

  static fromEntity(
    settings: UserSettings | null,
  ): NotificationPreferencesResDto {
    return {
      research: {
        newPapersInField: settings?.notifyNewPapersInField ?? true,
        readingListActivity: settings?.notifyReadingListActivity ?? true,
      },
      social: {
        newFollowers: settings?.notifyNewFollowers ?? true,
        discussionReplies: settings?.notifyDiscussionReplies ?? true,
        commentMentions: settings?.notifyCommentMentions ?? true,
        votesOnContent: settings?.notifyVotesOnContent ?? true,
      },
      system: {
        securityAlerts: true,
      },
    };
  }
}
