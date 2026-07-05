import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';
import { type Request } from 'express';

import { HttpResponse } from 'src/common/types/api.types';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { NotificationListResDto } from '../dto/responses/notification-list.res.dto';
import { NotificationResDto } from '../dto/responses/notification.res.dto';
import { NotificationCenterService } from '../services/notification-center.service';
import { IdDto } from 'src/common/dto/id.dto';

@ApiTags('Notification Center')
@ApiBearerAuth()
@ApiExtraModels(
  NotificationListResDto,
  NotificationResDto
)
@Controller('notifications')
export class NotificationCenterController {
  constructor(private readonly notificationCenterService: NotificationCenterService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation(
    { summary: 'Get paginated list of notifications' }
  )
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated list of notifications fetched successfully.',
    schema: {
      properties: {
        data: { $ref: getSchemaPath(NotificationListResDto) },
      },
    },
  })
  async getNotifications(
    @Req() req: Request,
    @Query() query: PaginationDto,
  ): Promise<HttpResponse<NotificationListResDto>> {
    return this.notificationCenterService.getNotifications(req.user!.id, query);
  }

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread notification count fetched successfully.',
  })
  async getUnreadCount(
    @Req() req: Request,
  ): Promise<HttpResponse<{ unreadCount: number }>> {
    return this.notificationCenterService.getUnreadCount(req.user!.id);
  }

  @Patch('read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'All notifications marked as read.' 
  })
  async markAllAsRead(
    @Req() req: Request,
  ): Promise<HttpResponse> {
    return this.notificationCenterService.markAllAsRead(req.user!.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Notification marked as read.' 
  })
  async markAsRead(
    @Req() req: Request,
    @Param() { id }: IdDto,
  ): Promise<HttpResponse> {
    return this.notificationCenterService.markAsRead(id, req.user!.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a single notification' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'Notification deleted successfully.' 
  })
  async deleteOne(
    @Req() req: Request,
    @Param() { id }: IdDto,
  ): Promise<HttpResponse> {
    return this.notificationCenterService.deleteOne(id, req.user!.id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all notifications' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'All notifications deleted successfully.' 
  })
  async deleteAll(
    @Req() req: Request,
  ): Promise<HttpResponse> {
    return this.notificationCenterService.deleteAll(req.user!.id);
  }
}
