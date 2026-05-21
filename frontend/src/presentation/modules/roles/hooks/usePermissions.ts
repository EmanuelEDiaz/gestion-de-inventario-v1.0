'use client';

import { useQuery } from '@tanstack/react-query';
import { permissionRepository } from '@/infrastructure/repositories/user/RoleRepository';
import type { Permission } from '@/core/user/entities/user';

export function usePermissions() {
  return useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: () => permissionRepository.getAll(),
    staleTime: 30 * 60 * 1000,
  });
}
