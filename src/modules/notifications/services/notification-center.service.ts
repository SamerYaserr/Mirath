import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { HttpResponse } from 'src/common/types/api.types';
import { NotificationListResDto } from '../dto/responses/notification-list.res.dto';

@Injectable()
export class NotificationCenterService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  async getNotifications(userId: string, query: PaginationDto): Promise<HttpResponse<NotificationListResDto>> {
    const { page, limit, skip } = query;

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationsRepository.findAllByRecipient(userId, skip, limit),
      this.notificationsRepository.countByRecipient(userId),
      this.notificationsRepository.countUnread(userId),
    ]);

    return {
      data: NotificationListResDto.fromEntity({ notifications, unreadCount, page, total }),
      message: 'Paginated list of notifications fetched successfully.',
    };
  }

  async getUnreadCount(userId: string): Promise<HttpResponse<{ unreadCount: number }>> {
    const unreadCount = await this.notificationsRepository.countUnread(userId);
    return { 
        data: { unreadCount },
        message: 'Unread notification count fetched successfully.',
    };
  }

  async markAllAsRead(userId: string): Promise<HttpResponse> {
    await this.notificationsRepository.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  async markAsRead(id: string, userId: string): Promise<HttpResponse> {
    await this.notificationsRepository.markAsRead(id, userId);
    return { message: 'Notification marked as read' };
  }

  async deleteOne(id: string, userId: string): Promise<HttpResponse> {
    await this.notificationsRepository.deleteOne(id, userId);
    return { message: 'Notification deleted successfully' };
  }

  async deleteAll(userId: string): Promise<HttpResponse> {
    await this.notificationsRepository.deleteAll(userId);
    return { message: 'All notifications deleted successfully' };
  }
}
