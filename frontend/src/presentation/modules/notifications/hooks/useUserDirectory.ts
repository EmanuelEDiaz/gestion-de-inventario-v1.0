import { useQuery } from '@tanstack/react-query';
import { userDirectoryApi } from '@/infrastructure/api/notification-api';

export function useUserDirectory() {
  return useQuery({
    queryKey: ['users', 'directory'],
    queryFn: () => userDirectoryApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}
