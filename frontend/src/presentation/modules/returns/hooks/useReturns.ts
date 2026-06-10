'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Return, CreateReturnData, UpdateReturnData } from '@/core/return/entities/return';
import { ReturnRepository } from '@/infrastructure/repositories/return/ReturnRepository';
import { 
  GetReturnsUseCase, CreateReturnUseCase, UpdateReturnUseCase,
  ConfirmReturnUseCase, CancelReturnUseCase, DeleteReturnUseCase
} from '@/core/return/use-cases';

// Singletons
const repo = new ReturnRepository();
const getReturns = new GetReturnsUseCase(repo);
const createReturn = new CreateReturnUseCase(repo);
const updateReturn = new UpdateReturnUseCase(repo);
const confirmReturn = new ConfirmReturnUseCase(repo);
const cancelReturn = new CancelReturnUseCase(repo);
const deleteReturn = new DeleteReturnUseCase(repo);

export function useReturns() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReturns.execute();
      setReturns(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar devoluciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = useCallback(async (data: CreateReturnData) => {
    const created = await createReturn.execute(data);
    setReturns(prev => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, data: UpdateReturnData) => {
    const updated = await updateReturn.execute(id, data);
    setReturns(prev => prev.map(r => r.id === id ? updated : r));
    return updated;
  }, []);

  const confirm = useCallback(async (id: string) => {
    const confirmed = await confirmReturn.execute(id);
    setReturns(prev => prev.map(r => r.id === id ? confirmed : r));
    return confirmed;
  }, []);

  const cancel = useCallback(async (id: string) => {
    const cancelled = await cancelReturn.execute(id);
    setReturns(prev => prev.map(r => r.id === id ? cancelled : r));
    return cancelled;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteReturn.execute(id);
    setReturns(prev => prev.filter(r => r.id !== id));
  }, []);

  const deleteMany = useCallback(async (ids: string[]) => {
    await repo.deleteAll(ids);
    setReturns(prev => prev.filter(r => !ids.includes(r.id)));
  }, []);

  return { returns, loading, error, fetchAll, create, update, confirm, cancel, remove, deleteMany };
}
