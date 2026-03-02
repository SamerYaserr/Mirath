import { ApiProperty } from '@nestjs/swagger';

export class AddedPaperResDto {
  @ApiProperty({ example: 'c1a9d9f1-4b21-4b99-8d22-347799777555' })
  readingListId: string;

  @ApiProperty({ example: 'p1q2r3s4-t5u6-v7w8-x9y0-z1234567890a' })
  paperId: string;
}
