import type { Request } from 'express';
import {
  Body,
  Controller,
  Get,
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
  // Only one profile setup allowed after signup
  setupProfile(
    @Req() req: Request,
    @Body() dto: ProfileSetupDto,
    @UploadedFile(ProfilePhotoPipe) profilePhoto: Express.Multer.File,
  ) {
    return this.usersService.setupProfile(req.user!.id, profilePhoto, dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      "Retrieves the currently authenticated user's full profile, including interests and fields of study.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        message: 'User profile retrieved successfully',
        data: {
          id: 'aab521c1-564a-4783-a4aa-f694ee49f290',
          username: 'johndoe123',
          email: 'john.doe@example.com',
          fullName: 'John Doe',
          photoUrl:
            'https://res.cloudinary.com/demo/image/upload/v1/profile.jpg',
          bio: 'Passionate researcher and software engineer specializing in AI.',
          birthDate: '1998-05-15T00:00:00.000Z',
          country: 'Canada',
          levelOfEducation: 'GRADUATE',
          university: 'University of Toronto',
          role: 'USER',
          status: 'ACTIVE',
          isEmailVisible: true,
          isPremium: false,
          createdAt: '2024-01-10T08:30:00.000Z',
          updatedAt: '2025-01-12T10:45:00.000Z',

          interests: [
            {
              id: 'uuid',
              name: 'Technology',
            },
            {
              id: '1f1b22e3-aa0a-4769-8816-ab88f21e4ed6',
              name: 'Chemistry',
            },
          ],
          fieldsOfStudy: [
            {
              id: 'uuid',
              name: 'Computer Science',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  getMyProfile(@Req() req: Request) {
    return this.usersService.getMyProfile(req.user!.id);
  }
}
