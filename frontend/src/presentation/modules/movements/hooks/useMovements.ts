'use client';

import { useState, useCallback, useEffect } from 'react';
import { InventoryMovement, MovementFilter } from '@/core/movement/entities/inventory-movement';
import { movementRepository } from '@/infrastructure/repositories/movement/MovementRepository';
import {
  GetAllMovementsUseCase,
  GetMovementByIdUseCase,
  GetMovementsByWarehouseProductUseCase,
  GetMovementsByDocumentUseCase,
  CountMovementsUseCase
} from '@/core/movement/use-cases';

interface UseMovementsState {
  movements: InventoryMovement[];
  selectedMovement: InventoryMovement | null;
  totalCount: number;
  isLoading: boolean;
  error: string | null;
}

export function useMovements(initialFilter?: MovementFilter) {
  const [state, setState] = useState<UseMovementsState>({
    movements: [],
    selectedMovement: null,
    totalCount: 0,
    isLoading: false,
    error: null
  });

  const getAllUseCase = new GetAllMovementsUseCase(movementRepository);
  const getByIdUseCase = new GetMovementByIdUseCase(movementRepository);
  const getByWarehouseProductUseCase = new GetMovementsByWarehouseProductUseCase(movementRepository);
  const getByDocumentUseCase = new GetMovementsByDocumentUseCase(movementRepository);
  const countUseCase = new CountMovementsUseCase(movementRepository);

  const fetchAll = useCallback(async (filter?: MovementFilter) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const [data, count] = await Promise.all([
        getAllUseCase.execute(filter),
        countUseCase.execute(filter)
      ]);
      setState(prev => ({ ...prev, movements: data, totalCount: count, isLoading: false }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error cargando movimientos',
        isLoading: false 
      }));
    }
  }, []);

  const fetchById = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getByIdUseCase.execute(id);
      setState(prev => ({ ...prev, selectedMovement: data, isLoading: false }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error cargando movimiento',
        isLoading: false 
      }));
    }
  }, []);

  const fetchByWarehouseProduct = useCallback(async (warehouseId: string, productId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getByWarehouseProductUseCase.execute(warehouseId, productId);
      setState(prev => ({ ...prev, movements: data, isLoading: false }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error cargando movimientos',
        isLoading: false 
      }));
    }
  }, []);

  const fetchByDocument = useCallback(async (docType: string, docId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getByDocumentUseCase.execute(docType, docId);
      setState(prev => ({ ...prev, movements: data, isLoading: false }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error cargando movimientos',
        isLoading: false 
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    if (initialFilter) {
      fetchAll(initialFilter);
    }
  }, []);

  return {
    ...state,
    fetchAll,
    fetchById,
    fetchByWarehouseProduct,
    fetchByDocument,
    clearError
  };
}
