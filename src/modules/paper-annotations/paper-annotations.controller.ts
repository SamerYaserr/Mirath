import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Paper Annotations')
@ApiBearerAuth()
@Controller('papers/:id/highlights')
export class PaperAnnotationsController {}
