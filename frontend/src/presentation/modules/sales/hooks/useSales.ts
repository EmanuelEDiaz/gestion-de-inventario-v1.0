'use client';

import { useState, useCallback, useEffect } from 'react';
import { Sale, SaleFilter, CreateSaleInput } from '@/core/entities/sale';
import { saleRepository } from '@/infrastructure/repositories/SaleRepository';
import {
  GetAllSalesUseCase,
  GetSaleByIdUseCase,
  CreateSaleUseCase,
  ConfirmSaleUseCase,
  DeliverSaleUseCase,
  CancelSaleUseCase,
  DeleteSaleUseCase
} from '@/core/use-cases/sale';

interface UseSalesState {
  sales: Sale[];
  selectedSale: Sale | null;
  isLoading: boolean;
  error: string | null;
}

export function useSales(initialFilter?: SaleFilter) {
  const [state, setState] = useState<UseSalesState>({
    sales: [],
    selectedSale: null,
    isLoading: false,
    error: null
  });

  const getAllUseCase = new GetAllSalesUseCase(saleRepository);
  const getByIdUseCase = new GetSaleByIdUseCase(saleRepository);
  const createUseCase = new CreateSaleUseCase(saleRepository);
  const confirmUseCase = new ConfirmSaleUseCase(saleRepository);
  const deliverUseCase = new DeliverSaleUseCase(saleRepository);
  const cancelUseCase = new CancelSaleUseCase(saleRepository);
  const deleteUseCase = new DeleteSaleUseCase(saleRepository);

  const fetchAll = useCallback(async (filter?: SaleFilter) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getAllUseCase.execute(filter);
      setState(prev => ({ ...prev, sales: data, isLoading: false }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error cargando ventas',
        isLoading: false 
      }));
    }
  }, []);

  const fetchById = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getByIdUseCase.execute(id);
      setState(prev => ({ ...prev, selectedSale: data, isLoading: false }));
      return data;
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error cargando venta',
        isLoading: false 
      }));
      return null;
    }
  }, []);

  const create = useCallback(async (input: CreateSaleInput) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await createUseCase.execute(input);
      setState(prev => ({ 
        ...prev, 
        sales: [data, ...prev.sales], 
        selectedSale: data,
        isLoading: false 
      }));
      return data;
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error creando venta',
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
        sales: prev.sales.map(s => s.id === id ? data : s),
        selectedSale: prev.selectedSale?.id === id ? data : prev.selectedSale,
        isLoading: false 
      }));
      return data;
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error confirmando venta',
        isLoading: false 
      }));
      return null;
    }
  }, []);

  const deliver = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await deliverUseCase.execute(id);
      setState(prev => ({ 
        ...prev, 
        sales: prev.sales.map(s => s.id === id ? data : s),
        selectedSale: prev.selectedSale?.id === id ? data : prev.selectedSale,
        isLoading: false 
      }));
      return data;
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error entregando venta',
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
        sales: prev.sales.map(s => s.id === id ? data : s),
        selectedSale: prev.selectedSale?.id === id ? data : prev.selectedSale,
        isLoading: false 
      }));
      return data;
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error cancelando venta',
        isLoading: false 
      }));
      return null;
    }
  }, []);

  const deleteSale = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await deleteUseCase.execute(id);
      setState(prev => ({ 
        ...prev, 
        sales: prev.sales.filter(s => s.id !== id),
        selectedSale: prev.selectedSale?.id === id ? null : prev.selectedSale,
        isLoading: false 
      }));
      return true;
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error eliminando venta',
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
    deliver,
    cancel,
    deleteSale,
    clearError
  };
}
