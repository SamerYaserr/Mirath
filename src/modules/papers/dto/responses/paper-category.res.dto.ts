import { ApiProperty } from '@nestjs/swagger';

export class PaperCategoryResDto {
  @ApiProperty({
    description: 'Paper category name',
    example: 'Computer Science',
  })
  name: string;

  static fromValue(name: string): PaperCategoryResDto {
    const dto = new PaperCategoryResDto();
    dto.name = name;
    return dto;
  }
}
