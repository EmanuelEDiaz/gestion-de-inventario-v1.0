'use client';

import { useState, useCallback, useEffect } from 'react';
import { Purchase, PurchaseFilter, CreatePurchaseInput } from '@/core/entities/purchase';
import { purchaseRepository } from '@/infrastructure/repositories/PurchaseRepository';
import {
  GetAllPurchasesUseCase,
  CreatePurchaseUseCase,
  ConfirmPurchaseUseCase,
  ReceivePurchaseUseCase,
  CancelPurchaseUseCase,
  DeletePurchaseUseCase
} from '@/core/use-cases/purchase';

// Use cases singleton para evitar recreación en cada render
const useCases = {
  getAll: new GetAllPurchasesUseCase(purchaseRepository),
  create: new CreatePurchaseUseCase(purchaseRepository),
  confirm: new ConfirmPurchaseUseCase(purchaseRepository),
  receive: new ReceivePurchaseUseCase(purchaseRepository),
  cancel: new CancelPurchaseUseCase(purchaseRepository),
  delete: new DeletePurchaseUseCase(purchaseRepository),
};

interface State {
  purchases: Purchase[];
  isLoading: boolean;
  error: string | null;
}

export function usePurchases(initialFilter?: PurchaseFilter) {
  const [state, setState] = useState<State>({ purchases: [], isLoading: false, error: null });

  const setLoading = () => setState(p => ({ ...p, isLoading: true, error: null }));
  const setError = (msg: string) => setState(p => ({ ...p, isLoading: false, error: msg }));
  const updatePurchase = (id: string, data: Purchase) => 
    setState(p => ({ ...p, purchases: p.purchases.map(x => x.id === id ? data : x), isLoading: false }));

  const fetchAll = useCallback(async (filter?: PurchaseFilter) => {
    setLoading();
    try {
      const data = await useCases.getAll.execute(filter);
      setState({ purchases: data, isLoading: false, error: null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando compras');
    }
  }, []);

  const create = useCallback(async (input: CreatePurchaseInput) => {
    setLoading();
    try {
      const data = await useCases.create.execute(input);
      setState(p => ({ ...p, purchases: [data, ...p.purchases], isLoading: false }));
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error creando compra');
      return null;
    }
  }, []);

  const confirm = useCallback(async (id: string) => {
    setLoading();
    try {
      const data = await useCases.confirm.execute(id);
      updatePurchase(id, data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error confirmando compra');
      return null;
    }
  }, []);

  const receive = useCallback(async (id: string, date?: string) => {
    setLoading();
    try {
      const data = await useCases.receive.execute(id, date);
      updatePurchase(id, data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error recibiendo compra');
      return null;
    }
  }, []);

  const cancel = useCallback(async (id: string) => {
    setLoading();
    try {
      const data = await useCases.cancel.execute(id);
      updatePurchase(id, data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cancelando compra');
      return null;
    }
  }, []);

  const deletePurchase = useCallback(async (id: string) => {
    setLoading();
    try {
      await useCases.delete.execute(id);
      setState(p => ({ ...p, purchases: p.purchases.filter(x => x.id !== id), isLoading: false }));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error eliminando compra');
      return false;
    }
  }, []);

  useEffect(() => { fetchAll(initialFilter); }, []);

  return { ...state, fetchAll, create, confirm, receive, cancel, deletePurchase, clearError: () => setState(p => ({ ...p, error: null })) };
}
