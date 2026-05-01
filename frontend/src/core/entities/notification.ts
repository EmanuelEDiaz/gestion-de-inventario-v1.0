/**
 * Valores verificados en tests del backend.
 * ⚠️ No usar 'SYSTEM' ni 'MANUAL' — producen HTTP 400.
 */
export type NotificationType = 'SYSTEM_AUTO' | 'USER_MANUAL';

export type NotificationCategory = 'LOW_STOCK' | 'SYSTEM' | 'SALE' | 'PURCHASE' | 'SYNC';

export type NotificationTargetType = 'USER' | 'ALL';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string | null;
  targetType: NotificationTargetType;
  targetUserId: string | null;
  createdBy: string | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  read: boolean;
}

export interface CreateNotificationData {
  title: string;
  body?: string;
  category: NotificationCategory;
  targetType: NotificationTargetType;
  targetUserId?: string;
}

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  LOW_STOCK: 'Stock bajo',
  SYSTEM: 'Sistema',
  SALE: 'Venta',
  PURCHASE: 'Compra',
  SYNC: 'Sincronización',
};
