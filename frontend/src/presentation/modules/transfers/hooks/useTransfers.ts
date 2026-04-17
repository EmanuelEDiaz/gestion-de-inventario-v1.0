'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Transfer, CreateTransferRequest } from '@/core/entities/transfer';
import { TransferRepository } from '@/infrastructure/repositories/TransferRepository';
import { 
  GetTransfersUseCase, 
  CreateTransferUseCase,
  ConfirmTransferUseCase,
  ShipTransferUseCase,
  CompleteTransferUseCase,
  CancelTransferUseCase,
  DeleteTransferUseCase 
} from '@/core/use-cases/transfer';

// Singletons (patterns skill: evita recreación en cada render)
const repo = new TransferRepository();
const getTransfers = new GetTransfersUseCase(repo);
const createTransfer = new CreateTransferUseCase(repo);
const confirmTransfer = new ConfirmTransferUseCase(repo);
const shipTransfer = new ShipTransferUseCase(repo);
const completeTransfer = new CompleteTransferUseCase(repo);
const cancelTransfer = new CancelTransferUseCase(repo);
const deleteTransfer = new DeleteTransferUseCase(repo);

/**
 * Hook: Controller para Transferencias.
 * (hexagonal: entry adapter en presentation layer)
 * (patterns: < 100 líneas, singletons externos)
 */
export function useTransfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransfers.execute();
      setTransfers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading transfers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (data: CreateTransferRequest) => {
    const transfer = await createTransfer.execute(data);
    setTransfers(prev => [transfer, ...prev]);
    return transfer;
  };

  const confirm = async (id: string) => {
    const updated = await confirmTransfer.execute(id);
    setTransfers(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const ship = async (id: string) => {
    const updated = await shipTransfer.execute(id);
    setTransfers(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const complete = async (id: string, receivedDate?: string) => {
    const updated = await completeTransfer.execute(id, receivedDate);
    setTransfers(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const cancel = async (id: string) => {
    const updated = await cancelTransfer.execute(id);
    setTransfers(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const remove = async (id: string) => {
    await deleteTransfer.execute(id);
    setTransfers(prev => prev.filter(t => t.id !== id));
  };

  return { 
    transfers, loading, error, 
    refresh: load, create, confirm, ship, complete, cancel, remove 
  };
}
