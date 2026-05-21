/**
 * useProductFormController - Controller for product create/edit form
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { CreateProductData } from '@/core/product/entities/product';
import { CreateProductUseCase } from '@/core/product/use-cases/CreateProductUseCase';
import { productRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { productImageApi } from '@/infrastructure/api/image-upload-api';

interface FormState {
  isLoading: boolean;
  error: string | null;
}

const createProductUseCase = new CreateProductUseCase(productRepository);

interface ProductImagesDraft {
  files: File[];
  primaryIndex: number;
}

export function useProductFormController() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<FormState>({ isLoading: false, error: null });

  const handleSubmit = useCallback(async (data: CreateProductData, imagesDraft?: ProductImagesDraft) => {
    setState({ isLoading: true, error: null });
    try {
      const product = await createProductUseCase.execute(data);

      if (imagesDraft && imagesDraft.files.length > 0) {
        const primaryImage = imagesDraft.files[imagesDraft.primaryIndex];
        const secondaryImages = imagesDraft.files.filter((_, index) => index !== imagesDraft.primaryIndex);

        if (primaryImage) {
          await productImageApi.upload(product.id, primaryImage, true);
        }
        for (const image of secondaryImages) {
          await productImageApi.upload(product.id, image, false);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });

      router.push('/products');
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setState({ isLoading: false, error: message });
    }
  }, [router, queryClient]);

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
