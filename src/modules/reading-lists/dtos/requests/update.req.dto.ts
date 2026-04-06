import { PartialType } from '@nestjs/swagger';
import { CreateReadingListReqDto } from './create-reading-list.req.dto';

export class UpdateReadingListReqDto extends PartialType(
  CreateReadingListReqDto,
) {}
