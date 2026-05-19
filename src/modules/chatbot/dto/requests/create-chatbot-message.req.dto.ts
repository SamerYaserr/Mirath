import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateChatbotMessageReqDto {
  @ApiPropertyOptional({
    description: 'Text message content.',
    example: 'Can you summarize this paper for me?',
  })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  content?: string;

  @ApiPropertyOptional({
    description:
      'ID of a previously uploaded file (image or audio). ' +
      'Obtained from POST /chatbot/files. ' +
      'When provided, the message type is inferred from the file type.',
  })
  @IsOptional()
  @IsUUID()
  fileId?: string;
}
