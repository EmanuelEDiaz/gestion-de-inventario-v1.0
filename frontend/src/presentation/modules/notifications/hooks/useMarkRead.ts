import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationRepository } from '@/infrastructure/repositories/NotificationRepository';
import { toast } from '@/presentation/shared/components/ui/toast';

const repo = new NotificationRepository();

export function useMarkRead() {
  const qc = useQueryClient();

  const markOne = useMutation({
    mutationFn: (id: string) => repo.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Error al marcar notificación');
    },
  });

  const markAll = useMutation({
    mutationFn: () => repo.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas las notificaciones marcadas como leídas');
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Error al marcar notificaciones');
    },
  });

  return { markOne, markAll };
}
