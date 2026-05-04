import { useQuery } from '@tanstack/react-query';
import { NotificationRepository } from '@/infrastructure/repositories/NotificationRepository';

const repo = new NotificationRepository();

export function useNotifications(includeRead = false) {
  return useQuery({
    queryKey: ['notifications', includeRead],
    queryFn: () => repo.findAll(includeRead),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => repo.getUnreadCount(),
    refetchInterval: 30_000,
  });
}
