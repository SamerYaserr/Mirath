import { PickType } from '@nestjs/swagger';
import { RegisterDeviceTokenReqDto } from './register-device-token.req.dto';

export class DeleteDeviceTokenReqDto extends PickType(
  RegisterDeviceTokenReqDto,
  ['token'],
) {}
