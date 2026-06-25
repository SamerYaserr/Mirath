import { ArrayMaxSize, IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplaceInterestsReqDto {
  @ApiProperty({
    example: ['Machine Learning', 'Computer Vision'],
    description: 'List of research interests (max 10)',
    maxItems: 10,
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMaxSize(10)
  interests: string[];
}
