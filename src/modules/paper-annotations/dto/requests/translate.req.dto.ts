import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AiServiceReqDto } from './ai-service.req.dto';
import { SupportedLanguage } from '../../enums/supported-language.enum';

export class TranslateReqDto extends AiServiceReqDto {
  @ApiProperty({
    description: 'The target language to translate the selected text into.',
    enum: SupportedLanguage,
    example: SupportedLanguage.ARABIC,
  })
  @IsEnum(SupportedLanguage, {
    message: `targetLanguage must be one of the supported languages: ${Object.values(SupportedLanguage).join(', ')}`,
  })
  targetLanguage: SupportedLanguage;
}
