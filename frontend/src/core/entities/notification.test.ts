import { describe, it, expect } from 'vitest';
import type { Notification, CreateNotificationData, NotificationType, NotificationCategory, NotificationTargetType } from './notification';
import { NOTIFICATION_CATEGORY_LABELS } from './notification';

describe('Notification Entity', () => {
  const mockNotification: Notification = {
    id: 'notif-1',
    type: 'SYSTEM_AUTO',
    category: 'LOW_STOCK',
    title: 'Stock bajo: Arroz',
    body: 'El producto Arroz tiene 3 unidades restantes.',
    targetType: 'ALL',
    targetUserId: null,
    createdBy: null,
    entityType: 'Product',
    entityId: 'prod-1',
    createdAt: '2026-01-01T10:00:00Z',
    read: false,
  };

  it('should create a valid Notification', () => {
    // Assert
    expect(mockNotification.id).toBe('notif-1');
    expect(mockNotification.type).toBe('SYSTEM_AUTO');
    expect(mockNotification.read).toBe(false);
  });

  it('should validate NotificationType — solo SYSTEM_AUTO y USER_MANUAL', () => {
    // Arrange
    const validTypes: NotificationType[] = ['SYSTEM_AUTO', 'USER_MANUAL'];

    // Assert — verificado en tests del backend: 'SYSTEM' y 'MANUAL' no existen
    expect(validTypes).toContain(mockNotification.type);
    expect(validTypes).not.toContain('SYSTEM');
    expect(validTypes).not.toContain('MANUAL');
  });

  it('should validate all NotificationCategory values', () => {
    // Arrange
    const validCategories: NotificationCategory[] = [
      'LOW_STOCK', 'SYSTEM', 'SALE', 'PURCHASE', 'SYNC',
    ];

    // Assert
    expect(validCategories).toContain(mockNotification.category);
  });

  it('should validate NotificationTargetType values', () => {
    // Arrange
    const validTargets: NotificationTargetType[] = ['USER', 'ALL'];

    // Assert
    expect(validTargets).toContain(mockNotification.targetType);
  });

  it('should allow null on nullable fields', () => {
    // Arrange
    const notifWithNulls: Notification = {
      ...mockNotification,
      body: null,
      targetUserId: null,
      createdBy: null,
      entityType: null,
      entityId: null,
    };

    // Assert
    expect(notifWithNulls.body).toBeNull();
    expect(notifWithNulls.entityId).toBeNull();
  });

  it('should support USER targetType with targetUserId', () => {
    // Arrange
    const userNotif: Notification = {
      ...mockNotification,
      type: 'USER_MANUAL',
      targetType: 'USER',
      targetUserId: 'user-123',
    };

    // Assert
    expect(userNotif.targetType).toBe('USER');
    expect(userNotif.targetUserId).toBe('user-123');
  });
});

describe('NOTIFICATION_CATEGORY_LABELS', () => {
  it('should have a Spanish label for every category', () => {
    // Arrange
    const categories: NotificationCategory[] = [
      'LOW_STOCK', 'SYSTEM', 'SALE', 'PURCHASE', 'SYNC',
    ];

    // Assert
    categories.forEach((cat) => {
      expect(NOTIFICATION_CATEGORY_LABELS[cat]).toBeTruthy();
    });
  });
});

describe('CreateNotificationData', () => {
  it('should accept valid create data for USER_MANUAL', () => {
    // Arrange
    const createData: CreateNotificationData = {
      title: 'Recordatorio',
      body: 'Revisar deuda del cliente Juan',
      category: 'SYSTEM',
      targetType: 'USER',
      targetUserId: 'user-1',
    };

    // Assert
    expect(createData.targetType).toBe('USER');
    expect(createData.targetUserId).toBe('user-1');
  });

  it('should allow omitting optional fields for broadcast', () => {
    // Arrange
    const broadcastData: CreateNotificationData = {
      title: 'Cierre de caja',
      category: 'SYSTEM',
      targetType: 'ALL',
    };

    // Assert
    expect(broadcastData.body).toBeUndefined();
    expect(broadcastData.targetUserId).toBeUndefined();
  });
});
