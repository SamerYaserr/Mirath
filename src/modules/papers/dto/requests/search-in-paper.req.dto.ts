import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SearchInPaperReqDto {
  @ApiProperty({
    description: 'The search term for fuzzy matching against the paper content',
    example: 'neural networks',
  })
  @IsString({ message: 'Search term must be a string' })
  @IsNotEmpty({ message: 'Search term cannot be empty' })
  @MinLength(2, { message: 'Search term must be at least 2 characters long' })
  @MaxLength(200, {
    message: 'Search term must be no more than 200 characters long',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value?.trim() : value))
  q: string;
}
