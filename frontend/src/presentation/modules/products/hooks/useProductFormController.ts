/**
 * useProductFormController - Controller for product create/edit form
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { CreateProductData } from '@/core/entities/product';
import { CreateProductUseCase } from '@/core/use-cases/product/CreateProductUseCase';
import { productRepository } from '@/infrastructure/repositories/ProductRepository';

interface FormState {
  isLoading: boolean;
  error: string | null;
}

const createProductUseCase = new CreateProductUseCase(productRepository);

export function useProductFormController() {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ isLoading: false, error: null });

  const handleSubmit = useCallback(async (data: CreateProductData) => {
    setState({ isLoading: true, error: null });
    try {
      await createProductUseCase.execute(data);
      router.push('/products');
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setState({ isLoading: false, error: message });
    }
  }, [router]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    handleSubmit,
    clearError,
    goBack: () => router.back(),
  };
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { status: number } };
    if (axiosErr.response?.status === 409) {
      return 'Ya existe un producto con ese SKU o código de barras';
    }
  }
  return 'Error al crear el producto';
}
