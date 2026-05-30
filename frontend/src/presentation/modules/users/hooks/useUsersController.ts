'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userRepository } from '@/infrastructure/repositories/user/UserRepository';
import {
  GetUsersUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  ChangePasswordUseCase,
} from '@/core/user/use-cases';
import type { CreateUserData, UpdateUserData, ChangePasswordData } from '@/core/user/entities/user';
import { toast } from '@/presentation/shared/components/ui/toast';

const getUsers = new GetUsersUseCase(userRepository);
const createUser = new CreateUserUseCase(userRepository);
const updateUser = new UpdateUserUseCase(userRepository);
const changePassword = new ChangePasswordUseCase(userRepository);

export function useUsersController() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const query = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers.execute(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => createUser.execute(data),
    onSuccess: () => { invalidate(); toast.success('Usuario creado'); },
    onError: (error: Error) => toast.error(error.message || 'Error al crear usuario'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      updateUser.execute(id, data),
    onSuccess: () => { invalidate(); toast.success('Usuario actualizado'); },
    onError: (error: Error) => toast.error(error.message || 'Error al actualizar usuario'),
  });

  const passwordMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChangePasswordData }) =>
      changePassword.execute(id, data),
    onSuccess: () => toast.success('Contraseña actualizada'),
    onError: (error: Error) => toast.error(error.message || 'Error al cambiar contraseña'),
  });

  const avatarMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      userRepository.uploadAvatar(id, file),
    onSuccess: () => { invalidate(); toast.success('Avatar actualizado'); },
    onError: (error: Error) => toast.error(error.message || 'Error al subir avatar'),
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: (id: string) => userRepository.deleteAvatar(id),
    onSuccess: () => { invalidate(); toast.success('Avatar eliminado'); },
    onError: (error: Error) => toast.error(error.message || 'Error al eliminar avatar'),
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    create: createMutation.mutateAsync,
    update: async (params: { id: string; data: UpdateUserData }) => {
      await updateMutation.mutateAsync(params);
    },
    changeUserPassword: passwordMutation.mutateAsync,
    uploadAvatar: avatarMutation.mutateAsync,
    deleteAvatar: deleteAvatarMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isChangingPassword: passwordMutation.isPending,
  };
}
