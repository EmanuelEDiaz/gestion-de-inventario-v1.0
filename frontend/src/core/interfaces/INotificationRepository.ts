import type { Notification, CreateNotificationData, SendMessageRequest } from '@/core/entities/notification';

export interface INotificationRepository {
  findAll(includeRead?: boolean): Promise<Notification[]>;
  getUnreadCount(): Promise<number>;
  create(data: CreateNotificationData): Promise<Notification>;
  send(data: SendMessageRequest): Promise<Notification>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
  deleteOne(id: string): Promise<void>;
}
