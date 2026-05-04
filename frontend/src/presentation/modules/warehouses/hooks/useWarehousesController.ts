/**
 * useWarehousesController - Controller for warehouses module
 */

import { useState, useCallback, useEffect } from 'react';
import type { Warehouse } from '@/core/entities/warehouse';
import { GetWarehousesUseCase } from '@/core/use-cases/warehouse/GetWarehousesUseCase';
import { ToggleWarehouseStatusUseCase } from '@/core/use-cases/warehouse/ToggleWarehouseStatusUseCase';
import { warehouseRepository } from '@/infrastructure/repositories/WarehouseRepository';

interface UseWarehousesControllerState {
  warehouses: Warehouse[];
  isLoading: boolean;
  error: string | null;
  showInactive: boolean;
}

const getWarehousesUseCase = new GetWarehousesUseCase(warehouseRepository);
const toggleStatusUseCase = new ToggleWarehouseStatusUseCase(warehouseRepository);

export function useWarehousesController() {
  const [state, setState] = useState<UseWarehousesControllerState>({
    warehouses: [],
    isLoading: true,
    error: null,
    showInactive: false,
  });

  const fetchWarehouses = useCallback(async (showInactive: boolean) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const warehouses = await getWarehousesUseCase.execute(!showInactive);
      setState((prev) => ({ ...prev, warehouses, isLoading: false }));
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Error al cargar los almacenes',
      }));
    }
  }, []);

  useEffect(() => {
    fetchWarehouses(state.showInactive);
  }, [state.showInactive, fetchWarehouses]);

  const toggleShowInactive = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showInactive: show }));
  }, []);

  const toggleWarehouseStatus = useCallback(async (warehouse: Warehouse) => {
    try {
      await toggleStatusUseCase.execute(warehouse.id, !warehouse.active);
      fetchWarehouses(state.showInactive);
    } catch {
      setState((prev) => ({
        ...prev,
        error: 'Error al cambiar el estado del almacén',
      }));
    }
  }, [fetchWarehouses, state.showInactive]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    toggleShowInactive,
    toggleWarehouseStatus,
    refresh: () => fetchWarehouses(state.showInactive),
    clearError,
  };
}
