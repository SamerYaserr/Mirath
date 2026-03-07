import { ApiProperty } from '@nestjs/swagger';

export class MessageResDto {
  @ApiProperty({
    description: 'A message describing the result of the operation',
    example: 'Operation completed successfully.',
  })
  message: string;
}
