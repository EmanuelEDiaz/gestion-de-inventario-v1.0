 /**
 * Notifications API Client
 * 
 * Funciones para comunicarse con el backend WebFlux
 * GET /api/v1/notifications/* endpoints
 * PUT /api/v1/notifications/* endpoints
 */

import {
  Notification,
  NotificationListResponse,
  NotificationPreferences,
  NotificationSchedule,
  CreateNotificationRequest,
  UpdateNotificationPreferencesRequest,
  UpdateNotificationScheduleRequest,
  ApiError,
} from '@/core/entities/notification';

const BASE_URL = '/api/v1/notifications';

/**
 * Crea un ApiError con la estructura correcta del cliente
 */
function createApiError(status: number, message: string): ApiError {
  return {
    type: 'about:blank',
    title: 'API Error',
    status,
    detail: message,
  };
}

/**
 * GET /api/v1/notifications/system
 * Obtener notificaciones del sistema (SYSTEM source)
 */
export async function getSystemNotifications(
  page: number = 0,
  size: number = 10,
  token?: string
): Promise<NotificationListResponse> {
  const url = new URL(`${window.location.origin}${BASE_URL}/system`);
  url.searchParams.set('page', page.toString());
  url.searchParams.set('size', size.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw createApiError(response.status, `Failed to fetch system notifications: ${response.statusText}`);
  }

  return response.json();
}

/**
 * GET /api/v1/notifications/users
 * Obtener notificaciones de otros usuarios (USER source)
 */
export async function getUserNotifications(
  page: number = 0,
  size: number = 10,
  token?: string
): Promise<NotificationListResponse> {
  const url = new URL(`${window.location.origin}${BASE_URL}/users`);
  url.searchParams.set('page', page.toString());
  url.searchParams.set('size', size.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw createApiError(response.status, `Failed to fetch user notifications: ${response.statusText}`);
  }

  return response.json();
}

/**
 * GET /api/v1/notifications/preferences
 * Obtener preferencias del usuario (con defaults si no existen)
 */
export async function getNotificationPreferences(
  token?: string
): Promise<NotificationPreferences> {
  const response = await fetch(`${BASE_URL}/preferences`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw createApiError(response.status, `Failed to fetch notification preferences: ${response.statusText}`);
  }

  return response.json() as Promise<NotificationPreferences>;
}

/**
 * PUT /api/v1/notifications/preferences
 * Actualizar preferencias del usuario (partial update)
 */
export async function updateNotificationPreferences(
  preferences: UpdateNotificationPreferencesRequest,
  token?: string
): Promise<NotificationPreferences> {
  const response = await fetch(`${BASE_URL}/preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    throw createApiError(response.status, `Failed to update notification preferences: ${response.statusText}`);
  }

  return response.json();
}

/**
 * GET /api/v1/notifications/schedules
 * Obtener horarios silenciosos del usuario (con defaults si no existen)
 */
export async function getNotificationSchedule(
  token?: string
): Promise<NotificationSchedule> {
  const response = await fetch(`${BASE_URL}/schedules`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw createApiError(response.status, `Failed to fetch notification schedule: ${response.statusText}`);
  }

  return response.json();
}

/**
 * PUT /api/v1/notifications/schedules
 * Actualizar horarios silenciosos del usuario (partial update)
 */
export async function updateNotificationSchedule(
  schedule: UpdateNotificationScheduleRequest,
  token?: string
): Promise<NotificationSchedule> {
  const response = await fetch(`${BASE_URL}/schedules`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(schedule),
  });

  if (!response.ok) {
    throw createApiError(response.status, `Failed to update notification schedule: ${response.statusText}`);
  }

  return response.json();
}

/**
 * POST /api/v1/notifications/{id}/read
 * Marcar notificación como leída
 */
export async function markNotificationAsRead(
  notificationId: string,
  token?: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/${notificationId}/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw createApiError(response.status, `Failed to mark notification as read: ${response.statusText}`);
  }
}

/**
 * POST /api/v1/notifications/read-all
 * Marcar todas las notificaciones como leídas
 */
export async function markAllNotificationsAsRead(
  token?: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/read-all`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw createApiError(response.status, `Failed to mark all notifications as read: ${response.statusText}`);
  }
}

/**
 * DELETE /api/v1/notifications/{id}
 * Eliminar notificación
 */
export async function deleteNotification(
  notificationId: string,
  token?: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/${notificationId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw createApiError(response.status, `Failed to delete notification: ${response.statusText}`);
  }
}

/**
 * GET /api/v1/notifications/unread-count
 * Obtener conteo de notificaciones no leídas
 */
export async function getUnreadNotificationCount(
  token?: string
): Promise<number> {
  const response = await fetch(`${BASE_URL}/unread-count`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

if (!response.ok) {
    throw createApiError(response.status, `Failed to fetch unread count: ${response.statusText}`);
  }

  return response.json();
}

/**
 * POST /api/v1/notifications
 * Crear nueva notificación (solo ADMIN/MANAGER)
 */
export async function createNotification(
  notification: CreateNotificationRequest,
  token?: string
): Promise<Notification> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(notification),
  });

  if (!response.ok) {
    throw createApiError(response.status, `Failed to create notification: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Server-Sent Events: Conectar para stream de notificaciones en tiempo real
 * GET /api/v1/notifications/sse
 */
export function subscribeToNotifications(
  token?: string,
  onNotification?: (notification: Notification) => void,
  onError?: (error: Error) => void
): EventSource | null {
  try {
    const url = new URL(`${window.location.origin}${BASE_URL}/sse`);
    if (token) {
      url.searchParams.set('token', token);
    }

    const eventSource = new EventSource(url.toString());

    eventSource.addEventListener('notification', (event: MessageEvent) => {
      try {
        const notification = JSON.parse(event.data) as Notification;
        onNotification?.(notification);
      } catch (error) {
        onError?.(new Error('Failed to parse notification event'));
      }
    });

    eventSource.addEventListener('error', () => {
      onError?.(new Error('SSE connection error'));
    });

    return eventSource;
  } catch (error) {
    onError?.(new Error('Failed to establish SSE connection'));
    return null;
  }
}

/**
 * Cerrar conexión SSE
 */
export function unsubscribeFromNotifications(eventSource: EventSource | null): void {
  if (eventSource) {
    eventSource.close();
  }
}

/**
 * Aliases para compatibilidad con código existente
 */
export const listSystemNotifications = getSystemNotifications;
export const listUserNotifications = getUserNotifications;
