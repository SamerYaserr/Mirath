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
  Query,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { ProfileSetupReqDto } from './dto/requests/profile-setup.req.dto';
import { ProfilePhotoPipe } from 'src/common/pipes/profile-photo.pipe';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { IdDto } from 'src/common/dto/id.dto';
import { ProfileResDto } from './dto/responses/profile.res.dto';
import { FollowUserResDto } from './dto/responses/follow-user.res.dto';
import { SetupProfileResDto } from './dto/responses/setup-profile.res.dto';
import { MyProfileResDto } from './dto/responses/my-profile.res.dto';
import { HttpResponse } from 'src/common/types/api.types';
import { GetMeQueryDto } from './dto/requests/get-me-query.req.dto';
import { UpdateProfileReqDto } from './dto/requests/update-profile.req.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@ApiExtraModels(
  ProfileResDto,
  FollowUserResDto,
  SetupProfileResDto,
  MyProfileResDto,
)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('profile/setup')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('profilePhoto'))
  @ApiOperation({
    summary: 'Complete user profile setup',
    description:
      'Completes the profile setup for a newly registered user. Only one setup is allowed after signup.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'User full name',
          example: 'John Doe',
          minLength: 2,
          maxLength: 50,
        },
        levelOfEducation: {
          type: 'string',
          enum: ['HIGH_SCHOOL', 'UNDERGRADUATE', 'GRADUATE'],
          description: 'User level of education',
          example: 'HIGH_SCHOOL',
        },
        university: {
          type: 'string',
          description:
            'University name (required for non-high school education levels)',
          example: 'Harvard University',
          nullable: true,
          minLength: 2,
          maxLength: 100,
        },
        interests: {
          type: 'array',
          items: { type: 'string' },
          description:
            'List of user interests. In multipart/form-data, this can be multiple fields or a comma-separated string.',
          example: ['Technology', 'Sports', 'Music'],
        },
        profilePhoto: {
          type: 'string',
          format: 'binary',
          description: 'User profile photo (JPG, JPEG, PNG, or WebP, max 30MB)',
        },
      },
      required: ['name', 'levelOfEducation', 'interests'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile setup completed successfully.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Profile setup completed successfully.',
        },
        data: { $ref: getSchemaPath(SetupProfileResDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  setupProfile(
    @Req() req: Request,
    @Body() dto: ProfileSetupReqDto,
    @UploadedFile(ProfilePhotoPipe) profilePhoto: Express.Multer.File,
  ) {
    return this.usersService.setupProfile(req.user!.id, profilePhoto, dto);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('profilePhoto'))
  @ApiOperation({
    summary: 'Edit user profile',
    description:
      'Partially updates the profile fields via multipart/form-data. Fields omitted will remain unchanged.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully.',
    schema: {
      properties: {
        message: { type: 'string', example: 'Profile updated successfully' },
        data: { $ref: getSchemaPath(MyProfileResDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  async updateProfile(
    @Req() req: Request,
    @Body() dto: UpdateProfileReqDto,
    @UploadedFile(ProfilePhotoPipe) profilePhoto?: Express.Multer.File,
  ) {
    return this.usersService.updateProfile(req.user!.id, profilePhoto, dto);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'fields',
    required: false,
    description:
      'Comma-separated list of fields to return (sparse fieldsets). ' +
      'If omitted, the full profile is returned.',
    example: 'interests,fullName,photoUrl',
  })
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      "Retrieves the currently authenticated user's full profile, including interests, fields of study, number of following and followers.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'User profile retrieved successfully.',
        },
        data: { $ref: getSchemaPath(MyProfileResDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  getMyProfile(
    @Req() req: Request,
    @Query() query: GetMeQueryDto,
  ): Promise<HttpResponse<MyProfileResDto>> {
    return this.usersService.getMyProfile(req.user!.id, query.fields);
  }

  @Post(':id/follow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Follow a user',
    description: 'Follows the specified user.',
  })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User followed successfully.',
    schema: {
      properties: {
        message: { type: 'string', example: 'User followed successfully.' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'You cannot follow yourself.' })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  follow(@Req() req: Request, @Param() { id }: IdDto) {
    return this.usersService.follow(req.user!.id, id);
  }

  @Delete(':id/follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Unfollow a user',
    description: 'Unfollows the specified user.',
  })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User unfollowed successfully.',
  })
  @ApiBadRequestResponse({ description: 'You cannot unfollow yourself.' })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  unfollow(@Req() req: Request, @Param() { id }: IdDto) {
    return this.usersService.unfollow(req.user!.id, id);
  }

  @Get(':id/followers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user followers',
    description:
      'Retrieves a paginated list of followers for the specified user.',
  })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Followers retrieved successfully.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Followers retrieved successfully.',
        },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(FollowUserResDto) },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  getFollowers(
    @Req() req: Request,
    @Param() { id }: IdDto,
    @Query() pagination: PaginationDto,
  ) {
    return this.usersService.getFollowers(id, req.user!.id, pagination);
  }

  @Get(':id/following')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user following',
    description:
      'Retrieves a paginated list of users the specified user is following.',
  })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Following retrieved successfully.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Following retrieved successfully.',
        },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(FollowUserResDto) },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  getFollowing(
    @Req() req: Request,
    @Param() { id }: IdDto,
    @Query() pagination: PaginationDto,
  ) {
    return this.usersService.getFollowing(id, req.user!.id, pagination);
  }

  @Get(':id/profile')
  @ApiOperation({
    summary: 'Get profile header info',
    description:
      'Fetches static header info, statistics, and context-aware state (isMe, isFollowing) for a user profile.',
  })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully.',
    schema: {
      properties: {
        message: { type: 'string', example: 'Profile retrieved successfully.' },
        data: {
          type: 'object',
          properties: {
            profile: { $ref: getSchemaPath(ProfileResDto) },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  getProfile(
    @Req() { user }: Request,
    @Param() { id }: IdDto,
  ): Promise<HttpResponse<{ profile: ProfileResDto }>> {
    return this.usersService.getProfile(user!.id, id);
  }
}
