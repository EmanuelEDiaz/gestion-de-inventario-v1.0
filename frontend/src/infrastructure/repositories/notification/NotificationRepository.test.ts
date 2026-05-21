import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationRepository } from './NotificationRepository';
import { notificationApi } from '@/infrastructure/api/notification-api';
import type { Notification } from '@/core/notification/entities/notification';

vi.mock('@/infrastructure/api/notification-api', () => ({
  notificationApi: {
    getAll: vi.fn(),
    getUnreadCount: vi.fn(),
    create: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

const mockNotif: Notification = {
  id: 'notif-1',
  type: 'SYSTEM_AUTO',
  category: 'LOW_STOCK',
  title: 'Stock bajo',
  body: null,
  targetType: 'ALL',
  targetUserId: null,
  createdBy: null,
  entityType: null,
  entityId: null,
  createdAt: '2026-01-01T00:00:00Z',
  read: false,
};

describe('NotificationRepository', () => {
  let repo: NotificationRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new NotificationRepository();
  });

  it('findAll — defaults includeRead=false', async () => {
    // Arrange
    vi.mocked(notificationApi.getAll).mockResolvedValue([mockNotif]);

    // Act
    const result = await repo.findAll();

    // Assert
    expect(notificationApi.getAll).toHaveBeenCalledWith(false);
    expect(result).toHaveLength(1);
  });

  it('findAll — passes includeRead=true', async () => {
    // Arrange
    vi.mocked(notificationApi.getAll).mockResolvedValue([mockNotif]);

    // Act
    await repo.findAll(true);

    // Assert
    expect(notificationApi.getAll).toHaveBeenCalledWith(true);
  });

  it('getUnreadCount — returns count', async () => {
    // Arrange
    vi.mocked(notificationApi.getUnreadCount).mockResolvedValue(5);

    // Act
    const result = await repo.getUnreadCount();

    // Assert
    expect(result).toBe(5);
  });

  it('create — delegates to api', async () => {
    // Arrange
    vi.mocked(notificationApi.create).mockResolvedValue(mockNotif);

    // Act
    const result = await repo.create({
      title: 'Test',
      category: 'SYSTEM',
      targetType: 'ALL',
    });

    // Assert
    expect(notificationApi.create).toHaveBeenCalled();
    expect(result.id).toBe('notif-1');
  });

  it('markRead — calls api markRead', async () => {
    // Arrange
    vi.mocked(notificationApi.markRead).mockResolvedValue(undefined);

    // Act
    await repo.markRead('notif-1');

    // Assert
    expect(notificationApi.markRead).toHaveBeenCalledWith('notif-1');
  });

  it('markAllRead — calls api markAllRead', async () => {
    // Arrange
    vi.mocked(notificationApi.markAllRead).mockResolvedValue(undefined);

    // Act
    await repo.markAllRead();

    // Assert
    expect(notificationApi.markAllRead).toHaveBeenCalled();
  });
});
