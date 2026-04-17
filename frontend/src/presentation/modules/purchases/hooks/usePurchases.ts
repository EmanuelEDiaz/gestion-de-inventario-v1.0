'use client';

import { useState, useCallback, useEffect } from 'react';
import { Purchase, PurchaseFilter, CreatePurchaseInput } from '@/core/entities/purchase';
import { purchaseRepository } from '@/infrastructure/repositories/PurchaseRepository';
import {
  GetAllPurchasesUseCase,
  GetPurchaseByIdUseCase,
  CreatePurchaseUseCase,
  ConfirmPurchaseUseCase,
  ReceivePurchaseUseCase,
  CancelPurchaseUseCase,
  DeletePurchaseUseCase
} from '@/core/use-cases/purchase';

interface UsePurchasesState {
  purchases: Purchase[];
  selectedPurchase: Purchase | null;
  isLoading: boolean;
  error: string | null;
}

export function usePurchases(initialFilter?: PurchaseFilter) {
  const [state, setState] = useState<UsePurchasesState>({
    purchases: [],
    selectedPurchase: null,
    isLoading: false,
    error: null
  });

  const getAllUseCase = new GetAllPurchasesUseCase(purchaseRepository);
  const getByIdUseCase = new GetPurchaseByIdUseCase(purchaseRepository);
  const createUseCase = new CreatePurchaseUseCase(purchaseRepository);
  const confirmUseCase = new ConfirmPurchaseUseCase(purchaseRepository);
  const receiveUseCase = new ReceivePurchaseUseCase(purchaseRepository);
  const cancelUseCase = new CancelPurchaseUseCase(purchaseRepository);
  const deleteUseCase = new DeletePurchaseUseCase(purchaseRepository);

  const fetchAll = useCallback(async (filter?: PurchaseFilter) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getAllUseCase.execute(filter);
      setState(prev => ({ ...prev, purchases: data, isLoading: false }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error cargando compras',
        isLoading: false 
      }));
    }
  }, []);

  const fetchById = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getByIdUseCase.execute(id);
      setState(prev => ({ ...prev, selectedPurchase: data, isLoading: false }));
      return data;
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error cargando compra',
        isLoading: false 
      }));
      return null;
    }
  }, []);

  const create = useCallback(async (input: CreatePurchaseInput) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await createUseCase.execute(input);
      setState(prev => ({ 
        ...prev, 
        purchases: [data, ...prev.purchases], 
        selectedPurchase: data,
        isLoading: false 
      }));
      return data;
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error creando compra',
        isLoading: false 
      }));
      return null;
    }
  }, []);

  const confirm = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await confirmUseCase.execute(id);
      setState(prev => ({ 
        ...prev, 
        purchases: prev.purchases.map(p => p.id === id ? data : p),
        selectedPurchase: prev.selectedPurchase?.id === id ? data : prev.selectedPurchase,
        isLoading: false 
      }));
      return data;
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error confirmando compra',
        isLoading: false 
      }));
      return null;
    }
  }, []);

  const receive = useCallback(async (id: string, receivedDate?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await receiveUseCase.execute(id, receivedDate);
      setState(prev => ({ 
        ...prev, 
        purchases: prev.purchases.map(p => p.id === id ? data : p),
        selectedPurchase: prev.selectedPurchase?.id === id ? data : prev.selectedPurchase,
        isLoading: false 
      }));
      return data;
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error recibiendo compra',
        isLoading: false 
      }));
      return null;
    }
  }, []);

  const cancel = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await cancelUseCase.execute(id);
      setState(prev => ({ 
        ...prev, 
        purchases: prev.purchases.map(p => p.id === id ? data : p),
        selectedPurchase: prev.selectedPurchase?.id === id ? data : prev.selectedPurchase,
        isLoading: false 
      }));
      return data;
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error cancelando compra',
        isLoading: false 
      }));
      return null;
    }
  }, []);

  const deletePurchase = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await deleteUseCase.execute(id);
      setState(prev => ({ 
        ...prev, 
        purchases: prev.purchases.filter(p => p.id !== id),
        selectedPurchase: prev.selectedPurchase?.id === id ? null : prev.selectedPurchase,
        isLoading: false 
      }));
      return true;
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error eliminando compra',
        isLoading: false 
      }));
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    fetchAll(initialFilter);
  }, []);

  return {
    ...state,
    fetchAll,
    fetchById,
    create,
    confirm,
    receive,
    cancel,
    deletePurchase,
    clearError
  };
}
