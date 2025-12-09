import type { Request } from 'express';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ProfileSetupDto } from './dto/profile-setup.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfilePhotoPipe } from 'src/common/pipes/profile-photo.pipe';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('profile/setup')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('profilePhoto'))
  setupProfile(
    @Req() req: Request,
    @Body() dto: ProfileSetupDto,
    @UploadedFile(ProfilePhotoPipe) profilePhoto: Express.Multer.File,
  ) {
    return this.usersService.setupProfile(req.user!.id, profilePhoto, dto);
  }
}
