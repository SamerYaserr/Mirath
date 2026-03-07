import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddPaperReqDto {
  @ApiProperty({
    description: 'ID of the paper to add',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID('4', { message: 'paperId must be a valid UUID' })
  paperId: string;
}
