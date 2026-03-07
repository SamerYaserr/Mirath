import { PickType } from '@nestjs/swagger';
import { SignupReqDto } from './signup.req.dto';

export class ForgetPasswordReqDto extends PickType(SignupReqDto, ['email']) {}
