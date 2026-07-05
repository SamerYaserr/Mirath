import { ApiProperty } from '@nestjs/swagger';
import { NotificationResDto } from './notification.res.dto';
import { NotificationType, Notification } from '@prisma/client';

export class NotificationListResDto {
  @ApiProperty({
    type: [NotificationResDto],
    description: 'List of notifications',
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: NotificationType.REPLY,
        isRead: false,
        actorId: '123e4567-e89b-12d3-a456-426614174000',
        metadata: {
          commentId: '123e4567-e89b-12d3-a456-426614174000',
          discussionId: '123e4567-e89b-12d3-a456-426614174000',
          content: 'This is a comment',
        },
        createdAt: '2026-07-02T10:30:00.000Z',
      },
    ],
  })
  data: NotificationResDto[];

  @ApiProperty({
    description: 'Number of unread notifications',
    example: 5,
  })
  unreadCount: number;

  @ApiProperty({ description: 'Total count of all notifications' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  static fromEntity(entity: {
    notifications: Notification[],
    unreadCount: number,
    page: number,
    total: number,
  }): NotificationListResDto {
    const dto = new NotificationListResDto();
    const { notifications, unreadCount, page, total } = entity;
    dto.data = notifications.map((n) => NotificationResDto.fromEntity(n));
    dto.unreadCount = unreadCount;
    dto.page = page;
    dto.total = total;
    return dto;
  }
}
