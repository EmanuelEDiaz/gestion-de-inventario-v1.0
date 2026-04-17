'use client';

import { useState, useCallback, useEffect } from 'react';
import { Sale, SaleFilter, CreateSaleInput } from '@/core/entities/sale';
import { saleRepository } from '@/infrastructure/repositories/SaleRepository';
import {
  GetAllSalesUseCase,
  CreateSaleUseCase,
  ConfirmSaleUseCase,
  DeliverSaleUseCase,
  CancelSaleUseCase,
  DeleteSaleUseCase
} from '@/core/use-cases/sale';

// Use cases singleton
const useCases = {
  getAll: new GetAllSalesUseCase(saleRepository),
  create: new CreateSaleUseCase(saleRepository),
  confirm: new ConfirmSaleUseCase(saleRepository),
  deliver: new DeliverSaleUseCase(saleRepository),
  cancel: new CancelSaleUseCase(saleRepository),
  delete: new DeleteSaleUseCase(saleRepository),
};

interface State {
  sales: Sale[];
  isLoading: boolean;
  error: string | null;
}

export function useSales(initialFilter?: SaleFilter) {
  const [state, setState] = useState<State>({ sales: [], isLoading: false, error: null });

  const setLoading = () => setState(p => ({ ...p, isLoading: true, error: null }));
  const setError = (msg: string) => setState(p => ({ ...p, isLoading: false, error: msg }));
  const updateSale = (id: string, data: Sale) => 
    setState(p => ({ ...p, sales: p.sales.map(x => x.id === id ? data : x), isLoading: false }));

  const fetchAll = useCallback(async (filter?: SaleFilter) => {
    setLoading();
    try {
      const data = await useCases.getAll.execute(filter);
      setState({ sales: data, isLoading: false, error: null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando ventas');
    }
  }, []);

  const create = useCallback(async (input: CreateSaleInput) => {
    setLoading();
    try {
      const data = await useCases.create.execute(input);
      setState(p => ({ ...p, sales: [data, ...p.sales], isLoading: false }));
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error creando venta');
      return null;
    }
  }, []);

  const confirm = useCallback(async (id: string) => {
    setLoading();
    try {
      const data = await useCases.confirm.execute(id);
      updateSale(id, data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error confirmando venta');
      return null;
    }
  }, []);

  const deliver = useCallback(async (id: string) => {
    setLoading();
    try {
      const data = await useCases.deliver.execute(id);
      updateSale(id, data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error entregando venta');
      return null;
    }
  }, []);

  const cancel = useCallback(async (id: string) => {
    setLoading();
    try {
      const data = await useCases.cancel.execute(id);
      updateSale(id, data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cancelando venta');
      return null;
    }
  }, []);

  const deleteSale = useCallback(async (id: string) => {
    setLoading();
    try {
      await useCases.delete.execute(id);
      setState(p => ({ ...p, sales: p.sales.filter(x => x.id !== id), isLoading: false }));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error eliminando venta');
      return false;
    }
  }, []);

  useEffect(() => { fetchAll(initialFilter); }, []);

  return { ...state, fetchAll, create, confirm, deliver, cancel, deleteSale, clearError: () => setState(p => ({ ...p, error: null })) };
}
