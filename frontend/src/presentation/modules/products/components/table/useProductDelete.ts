'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { productRepository } from '@/infrastructure/repositories/ProductRepository';
import type { Product } from '@/core/entities/product';

interface UseProductDeleteOptions {
  onDeleteSuccess?: () => void;
}

export function useProductDelete({ onDeleteSuccess }: UseProductDeleteOptions = {}) {
  const handleDelete = useCallback((product: Product) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
      return;
    }

    productRepository.delete(product.id)
      .then(() => {
        toast.success('Producto eliminado correctamente');
        onDeleteSuccess?.();
      })
      .catch(() => {
        toast.error('Error al eliminar el producto');
      });
  }, [onDeleteSuccess]);

  return { handleDelete };
}
