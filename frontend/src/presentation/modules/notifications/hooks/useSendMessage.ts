import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationRepository } from '@/infrastructure/repositories/NotificationRepository';
import { toast } from '@/presentation/shared/components/ui/toast';
import type { SendMessageRequest } from '@/core/entities/notification';

const repo = new NotificationRepository();

export function useSendMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageRequest) => repo.send(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Mensaje enviado');
    },
    onError: (err: Error) => toast.error(err.message ?? 'Error al enviar mensaje'),
  });
}
