import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NoteReqDto {
  @ApiProperty({
    description: 'Note on the highlighted text',
    example:
      'Introduces the Transformer model, replacing recurrence with self-attention for parallelization and faster training.',
  })
  @IsString({ message: 'Note must be a string' })
  @IsNotEmpty({ message: 'Note cannot be empty' })
  @MaxLength(2000, {
    message: 'Note length cannot exceed 2000 characters',
  })
  note: string;
}
