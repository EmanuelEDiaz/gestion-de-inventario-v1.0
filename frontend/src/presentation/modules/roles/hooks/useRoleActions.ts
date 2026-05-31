'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roleRepository } from '@/infrastructure/repositories/user/RoleRepository';
import type { CreateRoleData, UpdateRoleData } from '@/core/user/entities/user';
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

  const remove = useMutation({
    mutationFn: (id: string) => roleRepository.remove(id),
    onSuccess: () => { invalidate(); toast.success('Rol eliminado'); },
    onError: (e: Error) => toast.error(e.message || 'Error al eliminar rol'),
  });

  const removeMany = useMutation({
    mutationFn: (ids: string[]) => roleRepository.removeMany(ids),
    onSuccess: () => { invalidate(); toast.success('Roles eliminados'); },
    onError: (e: Error) => toast.error(e.message || 'Error al eliminar roles'),
  });

  return {
    create: create.mutateAsync,
    update: update.mutateAsync,
    deactivate: deactivate.mutateAsync,
    remove: remove.mutateAsync,
    removeMany: removeMany.mutateAsync,
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isDeactivating: deactivate.isPending,
    isRemoving: remove.isPending,
  };
}
