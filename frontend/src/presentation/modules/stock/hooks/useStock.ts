'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { StockBalance, StockFilter } from '@/core/stock/entities/stock-balance';
import { stockRepository } from '@/infrastructure/repositories/stock/StockRepository';
import {
  GetAllStockBalancesUseCase,
  GetStockByWarehouseUseCase,
  GetStockByProductUseCase,
  GetStockBalanceUseCase,
  GetLowStockAlertsUseCase
} from '@/core/stock/use-cases';

interface UseStockState {
  balances: StockBalance[];
  selectedBalance: StockBalance | null;
  lowStockAlerts: StockBalance[];
  isLoading: boolean;
  error: string | null;
}

export function useStock(initialFilter?: StockFilter) {
  const [state, setState] = useState<UseStockState>({
    balances: [],
    selectedBalance: null,
    lowStockAlerts: [],
    isLoading: false,
    error: null
  });

  const getAllUseCase = useMemo(() => new GetAllStockBalancesUseCase(stockRepository), []);
  const getByWarehouseUseCase = useMemo(() => new GetStockByWarehouseUseCase(stockRepository), []);
  const getByProductUseCase = useMemo(() => new GetStockByProductUseCase(stockRepository), []);
  const getBalanceUseCase = useMemo(() => new GetStockBalanceUseCase(stockRepository), []);
  const getLowStockUseCase = useMemo(() => new GetLowStockAlertsUseCase(stockRepository), []);

  const fetchAll = useCallback(async (filter?: StockFilter) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getAllUseCase.execute(filter);
      setState(prev => ({ ...prev, balances: data, isLoading: false }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error cargando stock',
        isLoading: false 
      }));
    }
  }, [getAllUseCase]);

  const fetchByWarehouse = useCallback(async (warehouseId: string, belowReorderOnly = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getByWarehouseUseCase.execute(warehouseId, belowReorderOnly);
      setState(prev => ({ ...prev, balances: data, isLoading: false }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error cargando stock',
        isLoading: false 
      }));
    }
  }, [getByWarehouseUseCase]);

  const fetchByProduct = useCallback(async (productId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getByProductUseCase.execute(productId);
      setState(prev => ({ ...prev, balances: data, isLoading: false }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error cargando stock',
        isLoading: false 
      }));
    }
  }, [getByProductUseCase]);

  const fetchBalance = useCallback(async (warehouseId: string, productId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getBalanceUseCase.execute(warehouseId, productId);
      setState(prev => ({ ...prev, selectedBalance: data, isLoading: false }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error cargando balance',
        isLoading: false 
      }));
    }
  }, [getBalanceUseCase]);

  const fetchLowStockAlerts = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getLowStockUseCase.execute();
      setState(prev => ({ ...prev, lowStockAlerts: data, isLoading: false }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Error cargando alertas',
        isLoading: false 
      }));
    }
  }, [getLowStockUseCase]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    if (initialFilter) {
      fetchAll(initialFilter);
    }
  }, [fetchAll, initialFilter]);

  return {
    ...state,
    fetchAll,
    fetchByWarehouse,
    fetchByProduct,
    fetchBalance,
    fetchLowStockAlerts,
    clearError
  };
}
