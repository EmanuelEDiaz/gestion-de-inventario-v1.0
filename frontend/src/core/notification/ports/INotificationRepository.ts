import type { Notification, CreateNotificationRequest, SendMessageRequest } from '@/core/notification/entities/notification';

export interface INotificationRepository {
  findAll(includeRead?: boolean): Promise<Notification[]>;
  getUnreadCount(): Promise<number>;
  create(data: CreateNotificationRequest): Promise<Notification>;
  send(data: SendMessageRequest): Promise<Notification>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
  deleteOne(id: string): Promise<void>;
}
