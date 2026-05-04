'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userRepository } from '@/infrastructure/repositories/UserRepository';
import {
  GetUsersUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
} from '@/core/use-cases/user';
import type { CreateUserData, UpdateUserData } from '@/core/entities/user';
import { toast } from 'sonner';

const getUsers = new GetUsersUseCase(userRepository);
const createUser = new CreateUserUseCase(userRepository);
const updateUser = new UpdateUserUseCase(userRepository);

export function useUsersController() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers.execute(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => createUser.execute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario creado');
    },
    onError: (error: Error) => toast.error(error.message || 'Error al crear usuario'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      updateUser.execute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario actualizado');
    },
    onError: (error: Error) => toast.error(error.message || 'Error al actualizar usuario'),
  });

  const avatarMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      userRepository.uploadAvatar(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Avatar actualizado');
    },
    onError: (error: Error) => toast.error(error.message || 'Error al subir avatar'),
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    uploadAvatar: avatarMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
