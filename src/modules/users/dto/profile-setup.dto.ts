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
import { EducationLevel } from '../users.enums';

export class ProfileSetupDto {
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  name: string;

  @IsEnum(EducationLevel, {
    message: `Level of education must be one of: ${Object.values(EducationLevel).join(', ')}`,
  })
  levelOfEducation: EducationLevel;

  @IsString({ message: 'University name must be a string' })
  @MinLength(2, {
    message: 'University name must be at least 2 characters long',
  })
  @MaxLength(100, { message: 'University name must not exceed 100 characters' })
  @ValidateIf((obj) => obj.levelOfEducation !== EducationLevel.HIGH_SCHOOL, {
    message: 'University is required for non-high school education levels',
  })
  university?: string;

  @IsArray({ message: 'Interests must be an array' })
  @ArrayMinSize(1, { message: 'Please select at least 1 interest' })
  @ArrayMaxSize(10, { message: 'You can select a maximum of 10 interests' }) // This could be changed in the future
  @IsString({
    each: true,
    message: 'Each interest must be a string',
  })
  interests: string[];
}
