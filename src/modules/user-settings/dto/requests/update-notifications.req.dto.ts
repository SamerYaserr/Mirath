import { Prisma } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationsReqDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'newPapersInField must be a boolean' })
  newPapersInField?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'readingListActivity must be a boolean' })
  readingListActivity?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'newFollowers must be a boolean' })
  newFollowers?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'discussionReplies must be a boolean' })
  discussionReplies?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'commentMentions must be a boolean' })
  commentMentions?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'votesOnContent must be a boolean' })
  votesOnContent?: boolean;

  toUpsert(): Omit<
    Prisma.UserSettingsUncheckedCreateInput,
    'id' | 'userId' | 'createdAt' | 'updatedAt'
  > {
    const data: Omit<
      Prisma.UserSettingsUncheckedCreateInput,
      'id' | 'userId' | 'createdAt' | 'updatedAt'
    > = {};

    if (this.newPapersInField !== undefined) {
      data.notifyNewPapersInField = this.newPapersInField;
    }
    if (this.readingListActivity !== undefined) {
      data.notifyReadingListActivity = this.readingListActivity;
    }
    if (this.newFollowers !== undefined) {
      data.notifyNewFollowers = this.newFollowers;
    }
    if (this.discussionReplies !== undefined) {
      data.notifyDiscussionReplies = this.discussionReplies;
    }
    if (this.commentMentions !== undefined) {
      data.notifyCommentMentions = this.commentMentions;
    }
    if (this.votesOnContent !== undefined) {
      data.notifyVotesOnContent = this.votesOnContent;
    }

    return data;
  }
}
