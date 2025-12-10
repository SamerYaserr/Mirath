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
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Complete user profile setup',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile setup completed successfully',
    example: {
      message: 'Profile setup completed successfully',
      data: {
        id: 'aab521c1-564a-4783-a4aa-f694ee49f290',
        email: 'john.doe@example.com',
        username: 'johndoe123',
        fullName: 'John Doe',
        photoUrl: 'https://example.com',
        status: 'ACTIVE',
        levelOfEducation: 'Graduate',
        university: 'Harvard University',
        createdAt: '2025-12-10T10:30:00.000Z',
        updatedAt: '2025-12-10T10:35:00.000Z',
      },
    },
  })
  // ----------------------------------------------- //
  @Post('profile/setup')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('profilePhoto'))
  // @UseGuards(AuthGuard)
  // Only one profile setup allowed after signup
  setupProfile(
    @Req() req: Request,
    @Body() dto: ProfileSetupDto,
    @UploadedFile(ProfilePhotoPipe) profilePhoto: Express.Multer.File,
  ) {
    return this.usersService.setupProfile(req.user!.id, profilePhoto, dto);
  }
}
