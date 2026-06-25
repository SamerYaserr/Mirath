import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePrivacyReqDto {
  @ApiPropertyOptional({
    description: 'Whether the user wants their account to be private',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrivateAccount?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the user wants their profile to be searchable',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  allowProfileSearch?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the user wants their comments to be public',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  allowPublicComments?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the user wants their reading behavior to be used for recommendations',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  useReadingBehaviorForRecommendations?: boolean;
}
