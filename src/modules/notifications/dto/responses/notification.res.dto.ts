import { ApiProperty } from '@nestjs/swagger';
import { Notification, NotificationType } from '@prisma/client';

export class NotificationResDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Unique identifier of the notification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    enum: NotificationType,
    description: 'Type of the notification',
    example: NotificationType.REPLY,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Whether the notification has been read',
    example: false,
  })
  isRead: boolean;

  @ApiProperty({
    required: false,
    nullable: true,
    format: 'uuid',
    description: 'ID of the user who triggered the notification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  actorId: string | null;

  @ApiProperty({
    description: 'Metadata associated with the notification',
    example: {
      commentId: '123e4567-e89b-12d3-a456-426614174000',
      discussionId: '123e4567-e89b-12d3-a456-426614174000',
      content: 'This is a comment',
    },
  })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Timestamp when the notification was created',
    example: '2026-07-02T10:30:00.000Z',
  })
  createdAt: Date;

  static fromEntity(notification: Notification): NotificationResDto {
    const dto = new NotificationResDto();
    dto.id = notification.id;
    dto.type = notification.type;
    dto.isRead = notification.isRead;
    dto.actorId = notification.actorId;
    dto.metadata = notification.metadata as Record<string, any>;
    dto.createdAt = notification.createdAt;
    return dto;
  }
}
