import { RegisterDeviceTokenReqDto } from './dto/requests/register-device-token.req.dto';

export type RegisterOrRefreshPayload = {
  userId: string;
  dto: RegisterDeviceTokenReqDto;
};

export type UpsertDeviceTokenPayload = Pick<
  RegisterOrRefreshPayload,
  'userId'
> &
  Pick<RegisterDeviceTokenReqDto, 'token' | 'deviceId'>;
