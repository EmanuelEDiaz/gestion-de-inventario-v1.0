/**
 * ⚠️ Este archivo tiene un duplicado parcial en notification-api.ts
 * - notifications.api.ts: funciones top-level (preferencias, schedule, SSE, CRUD con paginación)
 * - notification-api.ts: objeto namespace notificationApi (CRUD básico, send, userDirectory)
 * Ambas tienen solapamiento en CRUD básico. No eliminar hasta consolidar imports (ver A6.2).
 * 12+ imports activos desde hooks compartidos apuntan a este archivo.
 */
import { apiClient } from './client';
import type {
  Notification,
  NotificationListResponse,
  NotificationPreferences,
  NotificationSchedule,
  CreateNotificationRequest,
  UpdateNotificationPreferencesRequest,
  UpdateNotificationScheduleRequest,
} from '@/core/notification/entities/notification';

const BASE = '/api/v1/notifications';

export async function getSystemNotifications(
  page: number = 0,
  size: number = 10
): Promise<NotificationListResponse> {
  const { data } = await apiClient.get<NotificationListResponse>(`${BASE}/system`, {
    params: { page, size },
  });
  return data;
}

export async function getUserNotifications(
  page: number = 0,
  size: number = 10
): Promise<NotificationListResponse> {
  const { data } = await apiClient.get<NotificationListResponse>(`${BASE}/users`, {
    params: { page, size },
  });
  return data;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const { data } = await apiClient.get<NotificationPreferences>(`${BASE}/preferences`);
  return data;
}

export async function updateNotificationPreferences(
  preferences: UpdateNotificationPreferencesRequest
): Promise<NotificationPreferences> {
  const { data } = await apiClient.put<NotificationPreferences>(`${BASE}/preferences`, preferences);
  return data;
}

export async function getNotificationSchedule(): Promise<NotificationSchedule> {
  const { data } = await apiClient.get<NotificationSchedule>(`${BASE}/schedules`);
  return data;
}

export async function updateNotificationSchedule(
  schedule: UpdateNotificationScheduleRequest
): Promise<NotificationSchedule> {
  const { data } = await apiClient.put<NotificationSchedule>(`${BASE}/schedules`, schedule);
  return data;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await apiClient.post(`${BASE}/${notificationId}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.post(`${BASE}/read-all`);
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await apiClient.delete(`${BASE}/${notificationId}`);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { data } = await apiClient.get<number>(`${BASE}/unread-count`);
  return data;
}

export async function createNotification(
  notification: CreateNotificationRequest
): Promise<Notification> {
  const { data } = await apiClient.post<Notification>(BASE, notification);
  return data;
}

export function subscribeToNotifications(
  onNotification?: (notification: Notification) => void,
  onError?: (error: Error) => void
): EventSource | null {
  try {
    const eventSource = new EventSource(`${BASE}/stream`);

    eventSource.addEventListener('notification', (event: MessageEvent) => {
      try {
        const notification = JSON.parse(event.data) as Notification;
        onNotification?.(notification);
      } catch {
        onError?.(new Error('Failed to parse notification event'));
      }
    });

    eventSource.addEventListener('error', () => {
      onError?.(new Error('SSE connection error'));
    });

    return eventSource;
  } catch {
    onError?.(new Error('Failed to establish SSE connection'));
    return null;
  }
}

export function unsubscribeFromNotifications(eventSource: EventSource | null): void {
  eventSource?.close();
}

export const listSystemNotifications = getSystemNotifications;
export const listUserNotifications = getUserNotifications;
