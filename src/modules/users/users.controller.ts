import type { Request } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { IdDto } from 'src/common/dto/id.dto';
import { Query } from '@nestjs/common';

// import { IdDto } from 'src/common/dto/id.dto';
import { ProfileResDto } from './dto/profile.res.dto';
import { HttpResponse } from 'src/common/types/api.types';

@Controller('users')
@ApiExtraModels(ProfileResDto)
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
      "Retrieves the currently authenticated user's full profile, including interests, fields of study, number of following and followers`.",
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
          followersCount: 1,
          followingCount: 0,
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  getMyProfile(@Req() req: Request) {
    return this.usersService.getMyProfile(req.user!.id);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Follow user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User followed successfully',
    schema: {
      example: {
        message: 'User followed successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'You cannot follow yourself',
    schema: {
      example: {
        message: 'You cannot follow yourself',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @Post(':id/follow')
  @HttpCode(HttpStatus.OK)
  follow(@Req() req: Request, @Param() { id }: IdDto) {
    return this.usersService.follow(req.user!.id, id);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Unfollow user',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User unfollowed successfully',
    schema: {
      example: {
        message: 'User unfollowed successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'You cannot unfollow yourself',
    schema: {
      example: {
        message: 'You cannot unfollow yourself',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @Delete(':id/follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  unfollow(@Req() req: Request, @Param() { id }: IdDto) {
    return this.usersService.unfollow(req.user!.id, id);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user followers',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Followers retrieved successfully',
    schema: {
      example: {
        message: 'Followers retrieved successfully',
        data: {
          followers: [
            {
              id: 'uuid',
              username: 'johndoe123',
              fullName: 'John Doe',
              photoUrl:
                'https://res.cloudinary.com/demo/image/upload/v1/profile.jpg',
              bio: 'Passionate researcher and software engineer specializing in AI.',
              role: 'USER',
              status: 'ACTIVE',
              isPremium: false,
              isFollowing: true,
            },
          ],
        },
      },
    },
  })
  @Get(':id/followers')
  @HttpCode(HttpStatus.OK)
  getFollowers(
    @Req() req: Request,
    @Param() { id }: IdDto,
    @Query() pagination: PaginationDto,
  ) {
    return this.usersService.getFollowers(id, req.user!.id, pagination);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user following',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Following retrieved successfully',
    schema: {
      example: {
        message: 'Following retrieved successfully',
        data: {
          following: [
            {
              id: 'uuid',
              username: 'johndoe123',
              fullName: 'John Doe',
              photoUrl:
                'https://res.cloudinary.com/demo/image/upload/v1/profile.jpg',
              bio: 'Passionate researcher and software engineer specializing in AI.',
              role: 'USER',
              status: 'ACTIVE',
              isPremium: false,
              isFollowing: true,
            },
          ],
        },
      },
    },
  })
  @Get(':id/following')
  @HttpCode(HttpStatus.OK)
  getFollowing(
    @Req() req: Request,
    @Param() { id }: IdDto,
    @Query() pagination: PaginationDto,
  ) {
    return this.usersService.getFollowing(id, req.user!.id, pagination);
  @ApiOperation({
    summary: 'Get Profile Header Info',
    description:
      'Fetches static header info, statistics, and context-aware state (isMe, isFollowing) for a user profile.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully.',
    schema: {
      properties: {
        message: { type: 'string', example: 'Profile retrieved successfully.' },
        data: {
          properties: {
            profile: { $ref: getSchemaPath(ProfileResDto) },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      },
    },
  })
  @Get(':id/profile')
  getProfile(
    @Req() { user }: Request,
    @Param() { id }: IdDto,
  ): Promise<HttpResponse<{ profile: ProfileResDto }>> {
    return this.usersService.getProfile(user!.id, id);
  }
}
