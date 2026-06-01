'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from '@/presentation/shared/components/ui';
import { productRepository } from '@/infrastructure/repositories/product/ProductRepository';

export function useProductDeleteMutation(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (id: string) => productRepository.delete(id),
    onSuccess: () => {
      toast.success('Producto eliminado correctamente');
      onSuccess?.();
    },
    onError: (error: Error) => toast.error(error),
  });
}
