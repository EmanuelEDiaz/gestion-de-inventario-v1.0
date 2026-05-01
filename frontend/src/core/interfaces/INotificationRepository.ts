import type { Notification, CreateNotificationData } from '@/core/entities/notification';

export interface INotificationRepository {
  findAll(includeRead?: boolean): Promise<Notification[]>;
  getUnreadCount(): Promise<number>;
  create(data: CreateNotificationData): Promise<Notification>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}
