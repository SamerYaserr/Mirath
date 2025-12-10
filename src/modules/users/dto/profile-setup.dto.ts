import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { EducationLevel } from '../users.enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileSetupDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  name: string;

  @ApiProperty({
    description: 'User level of education',
    enum: EducationLevel,
    example: EducationLevel.HIGH_SCHOOL,
    enumName: 'EducationLevel',
  })
  @IsEnum(EducationLevel, {
    message: `Level of education must be one of: ${Object.values(EducationLevel).join(', ')}`,
  })
  levelOfEducation: EducationLevel;

  @ApiPropertyOptional({
    description:
      'University name (required for non-high school education levels)',
    example: 'Harvard University',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'University name must be a string' })
  @MinLength(2, {
    message: 'University name must be at least 2 characters long',
  })
  @MaxLength(100, { message: 'University name must not exceed 100 characters' })
  @ValidateIf((obj) => obj.levelOfEducation !== EducationLevel.HIGH_SCHOOL, {
    message: 'University is required for non-high school education levels',
  })
  university?: string;

  @ApiProperty({
    description:
      'List of user interests. Supports two formats:\n' +
      '• **JSON body:** Provide an array of strings.\n' +
      '• **Multipart form-data:** Provide a comma separated string (e.g., `"Tech, Sports, Music"`).',
    example: ['Technology', 'Sports', 'Music'],
    type: [String],
    minItems: 1,
    maxItems: 10,
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;

    // If multipart form data
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim());
    }
    return value;
  })
  @IsArray({ message: 'Interests must be an array' })
  @ArrayMinSize(1, { message: 'Please select at least 1 interest' })
  @ArrayMaxSize(10, { message: 'You can select a maximum of 10 interests' }) // This could be changed in the future
  @IsString({
    each: true,
    message: 'Each interest must be a string',
  })
  interests: string[];
}
