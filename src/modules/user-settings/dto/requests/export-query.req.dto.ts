import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReadingListExportFormat } from '../../enums/reading-list-export-format.enum';
import { AnnotationsExportFormat } from '../../enums/annotation-export-format.enum';


export class ExportReadingListsQueryDto {
  @ApiPropertyOptional({
    description: 'Export format for the reading lists file.',
    enum: ReadingListExportFormat,
    default: ReadingListExportFormat.JSON,
    example: ReadingListExportFormat.JSON,
  })
  @IsOptional()
  @IsEnum(ReadingListExportFormat)
  format: ReadingListExportFormat = ReadingListExportFormat.JSON;
}

export class ExportAnnotationsQueryDto {
  @ApiPropertyOptional({
    description: 'Export format for the annotations file.',
    enum: AnnotationsExportFormat,
    default: AnnotationsExportFormat.JSON,
    example: AnnotationsExportFormat.JSON,
  })
  @IsOptional()
  @IsEnum(AnnotationsExportFormat)
  format: AnnotationsExportFormat = AnnotationsExportFormat.JSON;
}