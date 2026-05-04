import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuery } from '@tanstack/react-query';
import { useNotifications, useUnreadCount } from './useNotifications';

vi.mock('@/infrastructure/repositories/NotificationRepository', () => ({
  NotificationRepository: class {
    findAll = vi.fn().mockResolvedValue([]);
    getUnreadCount = vi.fn().mockResolvedValue(3);
  },
}));

const mockUseQuery = vi.mocked(useQuery);

describe('useNotifications', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useQuery>);
  });

  it('debería tener queryKey ["notifications", false] por defecto', () => {
    useNotifications();
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['notifications', false] })
    );
  });

  it('debería incluir includeRead en queryKey cuando es true', () => {
    useNotifications(true);
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['notifications', true] })
    );
  });

  it('debería tener queryKey ["notifications", "unread-count"] para unread count', () => {
    useUnreadCount();
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['notifications', 'unread-count'],
        refetchInterval: 30_000,
      })
    );
  });
});
