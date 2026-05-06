'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roleRepository } from '@/infrastructure/repositories/RoleRepository';
import type { CreateRoleData, UpdateRoleData } from '@/core/entities/user';
import { toast } from '@/presentation/shared/components/ui/toast';

export function useRoleActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['roles'] });

  const create = useMutation({
    mutationFn: (data: CreateRoleData) => roleRepository.create(data),
    onSuccess: () => { invalidate(); toast.success('Rol creado'); },
    onError: (e: Error) => toast.error(e.message || 'Error al crear rol'),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleData }) =>
      roleRepository.update(id, data),
    onSuccess: () => { invalidate(); toast.success('Rol actualizado'); },
    onError: (e: Error) => toast.error(e.message || 'Error al actualizar rol'),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => roleRepository.deactivate(id),
    onSuccess: () => { invalidate(); toast.success('Rol desactivado'); },
    onError: (e: Error) => toast.error(e.message || 'Error al desactivar rol'),
  });

  return {
    create: create.mutateAsync,
    update: update.mutateAsync,
    deactivate: deactivate.mutateAsync,
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isDeactivating: deactivate.isPending,
  };
}
