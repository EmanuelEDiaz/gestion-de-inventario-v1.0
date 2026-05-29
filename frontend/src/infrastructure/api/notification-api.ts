/**
 * ⚠️ Este archivo tiene un duplicado parcial en notifications.api.ts
 * - notification-api.ts: objeto namespace notificationApi (CRUD básico, send, userDirectory)
 * - notifications.api.ts: funciones top-level (preferencias, schedule, SSE, CRUD con paginación)
 * Ambas tienen solapamiento en CRUD básico. No eliminar hasta consolidar imports (ver A6.2).
 * Usado por NotificationRepository.ts y useUserDirectory.ts.
 */
import { apiClient } from './client';
import type { Notification, CreateNotificationRequest, SendMessageRequest, UserDirectoryEntry } from '@/core/notification/entities/notification';

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

  create(data: CreateNotificationRequest): Promise<Notification> {
    return apiClient.post<Notification>(BASE, data).then((r) => r.data);
  },

  send(data: SendMessageRequest): Promise<Notification> {
    return apiClient.post<Notification>(`${BASE}/send`, data).then((r) => r.data);
  },

  markRead(id: string): Promise<void> {
    return apiClient.post<void>(`${BASE}/${id}/read`).then(() => undefined);
  },

  markAllRead(): Promise<void> {
    return apiClient.post<void>(`${BASE}/read-all`).then(() => undefined);
  },

  deleteOne(id: string): Promise<void> {
    return apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined);
  },
};

export const userDirectoryApi = {
  getAll(): Promise<UserDirectoryEntry[]> {
    return apiClient.get<UserDirectoryEntry[]>('/api/v1/users/directory').then((r) => r.data);
  },
};
