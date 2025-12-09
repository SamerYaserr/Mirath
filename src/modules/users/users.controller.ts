import type { Request } from 'express';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ProfileSetupDto } from './dto/profile-setup.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('profile/setup')
  @HttpCode(HttpStatus.OK)
  setupProfile(@Req() req: Request, @Body() dto: ProfileSetupDto) {
    return this.usersService.setupProfile(req.user!.id, dto);
  }
}
