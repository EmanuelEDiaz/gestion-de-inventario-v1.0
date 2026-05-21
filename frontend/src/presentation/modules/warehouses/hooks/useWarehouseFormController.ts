/**
 * useWarehouseFormController - Controller for warehouse create/edit form
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { CreateWarehouseData } from '@/core/warehouse/entities/warehouse';
import { CreateWarehouseUseCase } from '@/core/warehouse/use-cases/CreateWarehouseUseCase';
import { warehouseRepository } from '@/infrastructure/repositories/warehouse/WarehouseRepository';

interface FormState {
  isLoading: boolean;
  error: string | null;
}

const createWarehouseUseCase = new CreateWarehouseUseCase(warehouseRepository);

export function useWarehouseFormController() {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ isLoading: false, error: null });

  const handleSubmit = useCallback(async (data: CreateWarehouseData) => {
    setState({ isLoading: true, error: null });
    try {
      await createWarehouseUseCase.execute(data);
      router.push('/warehouses');
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
      return 'Ya existe un almacén con ese código';
    }
  }
  return 'Error al crear el almacén';
}
