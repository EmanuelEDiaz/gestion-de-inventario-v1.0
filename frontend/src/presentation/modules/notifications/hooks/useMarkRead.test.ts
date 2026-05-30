import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMarkRead } from './useMarkRead';

vi.mock('@/infrastructure/repositories/notification/NotificationRepository', () => ({
  NotificationRepository: class {
    markRead = vi.fn().mockResolvedValue(undefined);
    markAllRead = vi.fn().mockResolvedValue(undefined);
  },
}));

const mockUseMutation = vi.mocked(useMutation);
const mockUseQueryClient = vi.mocked(useQueryClient);

describe('useMarkRead', () => {
  const mockInvalidate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQueryClient.mockReturnValue({ invalidateQueries: mockInvalidate } as unknown as ReturnType<typeof useQueryClient>);
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useMutation>);
  });

  it('debería retornar markOne y markAll como mutaciones', () => {
    const { markOne, markAll } = useMarkRead();
    expect(markOne).toBeDefined();
    expect(markAll).toBeDefined();
  });

  it('debería llamar a useMutation dos veces (una por mutación)', () => {
    useMarkRead();
    expect(mockUseMutation).toHaveBeenCalledTimes(2);
  });
});
