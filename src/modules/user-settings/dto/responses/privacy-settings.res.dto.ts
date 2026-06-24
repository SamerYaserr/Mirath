import { ApiProperty } from '@nestjs/swagger';
import { UserSettings } from '@prisma/client';

export class PrivacySettingsResDto {
  @ApiProperty({
    description: 'Whether the user wants their account to be private',
    example: false,
  })
  isPrivateAccount: boolean;
  @ApiProperty({
    description: 'Whether the user appears in researcher search results',
    example: true,
  })
  allowProfileSearch: boolean;
  @ApiProperty({
    description: 'Whether other users can comment on the user\'s discussions',
    example: true,
  })
  allowPublicComments: boolean;
  @ApiProperty({
    description: 'Whether the user wants their reading behavior to be used for recommendations',
    example: true,
  })
  useReadingBehaviorForRecommendations: boolean;
  @ApiProperty({
    description: 'List of accounts that the user has blocked',
    example: [],
  })
  blockedAccounts: string[];

  static fromEntity(userSettings: UserSettings | null): PrivacySettingsResDto {
    const dto = new PrivacySettingsResDto();

    dto.isPrivateAccount = userSettings?.isPrivateAccount ?? false;
    dto.allowProfileSearch = userSettings?.allowProfileSearch ?? true;
    dto.allowPublicComments = userSettings?.allowPublicComments ?? true;
    dto.useReadingBehaviorForRecommendations = userSettings?.useReadingBehaviorForRecommendations ?? true;
    dto.blockedAccounts = [];

    return dto;
  }
}
