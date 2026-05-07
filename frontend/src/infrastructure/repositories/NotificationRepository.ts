import type { INotificationRepository } from '@/core/interfaces/INotificationRepository';
import type { Notification, CreateNotificationRequest, SendMessageRequest } from '@/core/entities/notification';
import { notificationApi } from '@/infrastructure/api/notification-api';

export class NotificationRepository implements INotificationRepository {
  async findAll(includeRead = false): Promise<Notification[]> {
    return notificationApi.getAll(includeRead);
  }

  async getUnreadCount(): Promise<number> {
    return notificationApi.getUnreadCount();
  }

  async create(data: CreateNotificationRequest): Promise<Notification> {
    return notificationApi.create(data);
  }

  async send(data: SendMessageRequest): Promise<Notification> {
    return notificationApi.send(data);
  }

  async markRead(id: string): Promise<void> {
    return notificationApi.markRead(id);
  }

  async markAllRead(): Promise<void> {
    return notificationApi.markAllRead();
  }

  async deleteOne(id: string): Promise<void> {
    return notificationApi.deleteOne(id);
  }
}
