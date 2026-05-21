import { describe, it, expect } from 'vitest';
import type { Notification, CreateNotificationRequest } from './notification';
import {
  NotificationCategory,
  NotificationTargetType,
  NotificationSource,
  NotificationPriority,
  DeliveryChannel,
  getCategoryLabel,
} from './notification';

describe('Notification Entity', () => {
  const mockNotification: Notification = {
    id: 'notif-1',
    title: 'Stock bajo: Arroz',
    body: 'El producto Arroz tiene 3 unidades restantes.',
    category: NotificationCategory.LOW_STOCK,
    source: NotificationSource.SYSTEM,
    priority: NotificationPriority.MEDIUM,
    deliveryChannel: DeliveryChannel.TOAST,
    targetType: NotificationTargetType.ALL,
    createdAt: '2026-01-01T10:00:00Z',
    read: false,
  };

  it('should create a valid Notification', () => {
    expect(mockNotification.id).toBe('notif-1');
    expect(mockNotification.read).toBe(false);
  });

  it('should validate NotificationTargetType values', () => {
    const validTargets: NotificationTargetType[] = [
      NotificationTargetType.ALL,
      NotificationTargetType.SPECIFIC_USER,
      NotificationTargetType.ROLE_BASED,
    ];
    expect(validTargets).toContain(mockNotification.targetType);
  });

  it('should support SPECIFIC_USER targetType with targetUserId', () => {
    const userNotif: Notification = {
      ...mockNotification,
      targetType: NotificationTargetType.SPECIFIC_USER,
      targetUserId: 'user-123',
    };
    expect(userNotif.targetType).toBe(NotificationTargetType.SPECIFIC_USER);
    expect(userNotif.targetUserId).toBe('user-123');
  });

  it('should allow optional fields to be absent', () => {
    expect(mockNotification.actionUrl).toBeUndefined();
    expect(mockNotification.tags).toBeUndefined();
    expect(mockNotification.targetUserId).toBeUndefined();
  });
});

describe('getCategoryLabel', () => {
  it('should have a Spanish label for every category', () => {
    const categories: NotificationCategory[] = [
      NotificationCategory.LOW_STOCK,
      NotificationCategory.CRITICAL_STOCK,
      NotificationCategory.STOCK_ADJUSTMENT,
      NotificationCategory.SYNC_STARTED,
      NotificationCategory.SYNC_COMPLETED,
      NotificationCategory.SYNC_FAILED,
      NotificationCategory.SALE_COMPLETED,
      NotificationCategory.PURCHASE_COMPLETED,
      NotificationCategory.RETURN_PROCESSED,
      NotificationCategory.TRANSFER_INITIATED,
      NotificationCategory.TRANSFER_COMPLETED,
      NotificationCategory.CREDIT_LIMIT_WARNING,
      NotificationCategory.CREDIT_LIMIT_EXCEEDED,
      NotificationCategory.CREDIT_PAYMENT_DUE,
      NotificationCategory.USER_MENTIONED,
      NotificationCategory.PERMISSION_GRANTED,
      NotificationCategory.PERMISSION_REVOKED,
      NotificationCategory.USER_INVITE,
      NotificationCategory.SYSTEM_MAINTENANCE,
      NotificationCategory.BACKUP_COMPLETED,
      NotificationCategory.ERROR_OCCURRED,
      NotificationCategory.VERSION_UPDATE,
    ];
    categories.forEach((cat) => {
      expect(getCategoryLabel(cat)).toBeTruthy();
    });
  });
});

describe('CreateNotificationRequest', () => {
  it('should accept valid create request', () => {
    const createData: CreateNotificationRequest = {
      title: 'Recordatorio',
      body: 'Revisar deuda del cliente Juan',
      category: NotificationCategory.USER_MENTIONED,
      targetType: NotificationTargetType.SPECIFIC_USER,
      targetUserId: 'user-1',
    };
    expect(createData.targetType).toBe(NotificationTargetType.SPECIFIC_USER);
    expect(createData.targetUserId).toBe('user-1');
  });

  it('should allow omitting optional fields for broadcast', () => {
    const broadcastData: CreateNotificationRequest = {
      title: 'Cierre de caja',
      body: 'El sistema se cerrará en 5 minutos.',
      category: NotificationCategory.SYSTEM_MAINTENANCE,
      targetType: NotificationTargetType.ALL,
    };
    expect(broadcastData.targetUserId).toBeUndefined();
    expect(broadcastData.priority).toBeUndefined();
  });
});

