import { PickType } from '@nestjs/swagger';
import { SignupDto } from './signup.dto';

export class ForgetPasswordDto extends PickType(SignupDto, ['email']) {}
