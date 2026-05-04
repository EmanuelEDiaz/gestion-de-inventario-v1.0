import { apiClient } from './client';
import type { Notification, CreateNotificationData } from '@/core/entities/notification';

const BASE = '/api/v1/notifications';

export const notificationApi = {
  getAll(includeRead = false): Promise<Notification[]> {
    return apiClient
      .get<Notification[]>(`${BASE}?includeRead=${includeRead}`)
      .then((r) => r.data);
  },

  getUnreadCount(): Promise<number> {
    return apiClient.get<number>(`${BASE}/unread-count`).then((r) => r.data);
  },

  create(data: CreateNotificationData): Promise<Notification> {
    return apiClient.post<Notification>(BASE, data).then((r) => r.data);
  },

  markRead(id: string): Promise<void> {
    return apiClient.post<void>(`${BASE}/${id}/read`).then(() => undefined);
  },

  markAllRead(): Promise<void> {
    return apiClient.post<void>(`${BASE}/read-all`).then(() => undefined);
  },
};
