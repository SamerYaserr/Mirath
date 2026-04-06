import { ApiProperty } from '@nestjs/swagger';

export class LibraryStatsResDto {
  @ApiProperty({
    example: 55,
    description: 'Reading lists the user owns plus lists saved from others',
  })
  listsCount: number;

  @ApiProperty({
    example: 10,
    description: 'Reading lists created (owned) by the user',
  })
  createdCount: number;

  @ApiProperty({
    example: 25,
    description: 'Papers the user has saved to their library',
  })
  savedCount: number;

  @ApiProperty({
    example: 0,
    description:
      'Projects owned by the user (returns 0 until Projects module is built)',
  })
  projectsCount: number;

  static fromCounts(params: {
    createdCount: number;
    savedListsCount: number;
    savedCount: number;
    projectsCount: number;
  }): LibraryStatsResDto {
    const dto = new LibraryStatsResDto();
    dto.createdCount = params.createdCount;
    dto.savedCount = params.savedCount;
    dto.projectsCount = params.projectsCount;
    dto.listsCount = params.createdCount + params.savedListsCount;
    return dto;
  }
}
