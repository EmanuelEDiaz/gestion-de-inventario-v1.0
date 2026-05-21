import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationRepository } from '@/infrastructure/repositories/notification/NotificationRepository';
import { toast } from '@/presentation/shared/components/ui/toast';

const repo = new NotificationRepository();

/** All mutating actions for notifications: mark-read, delete (individual + bulk). */
export function useNotificationActions() {
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['notifications'] });

  const markOne = useMutation({
    mutationFn: (id: string) => repo.markRead(id),
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message ?? 'Error al marcar como leída'),
  });

  const markAll = useMutation({
    mutationFn: () => repo.markAllRead(),
    onSuccess: () => {
      invalidate();
      toast.success('Todas las notificaciones marcadas como leídas');
    },
    onError: (err: Error) => toast.error(err.message ?? 'Error al marcar todas'),
  });

  const deleteOne = useMutation({
    mutationFn: (id: string) => repo.deleteOne(id),
    onSuccess: () => {
      invalidate();
      toast.success('Notificación eliminada');
    },
    onError: (err: Error) => toast.error(err.message ?? 'Error al eliminar notificación'),
  });

  const deleteMany = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => repo.deleteOne(id)));
    },
    onSuccess: () => {
      invalidate();
      toast.success('Notificaciones eliminadas');
    },
    onError: (err: Error) => toast.error(err.message ?? 'Error al eliminar notificaciones'),
  });

  return { markOne, markAll, deleteOne, deleteMany };
}
