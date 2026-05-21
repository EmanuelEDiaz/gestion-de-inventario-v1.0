'use client';

import { useQuery } from '@tanstack/react-query';
import { roleRepository } from '@/infrastructure/repositories/user/RoleRepository';
import type { Role } from '@/core/user/entities/user';

export function useRoles() {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => roleRepository.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}
