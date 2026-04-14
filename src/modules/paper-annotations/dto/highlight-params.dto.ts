import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

import { IdDto } from 'src/common/dto/id.dto';

export class HighlightParamsDto extends IdDto {
  @ApiProperty({
    description: 'Highlight Unique identifier in UUID format',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    type: String,
  })
  @IsNotEmpty({ message: 'Highlight ID is required in the request params' })
  @IsUUID('4', { message: 'Highlight ID must be a valid UUID' })
  highlightId: string;
}
