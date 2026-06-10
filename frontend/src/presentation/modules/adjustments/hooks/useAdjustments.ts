'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Adjustment, CreateAdjustmentData, UpdateAdjustmentData } from '@/core/adjustment/entities/adjustment';
import { AdjustmentRepository } from '@/infrastructure/repositories/adjustment/AdjustmentRepository';
import { 
  GetAdjustmentsUseCase,
  CreateAdjustmentUseCase, UpdateAdjustmentUseCase,
  ConfirmAdjustmentUseCase, CancelAdjustmentUseCase, DeleteAdjustmentUseCase
} from '@/core/adjustment/use-cases';

// Singletons (clean-code: evita reinstancias)
const repo = new AdjustmentRepository();
const getAdjustments = new GetAdjustmentsUseCase(repo);
const createAdjustment = new CreateAdjustmentUseCase(repo);
const updateAdjustment = new UpdateAdjustmentUseCase(repo);
const confirmAdjustment = new ConfirmAdjustmentUseCase(repo);
const cancelAdjustment = new CancelAdjustmentUseCase(repo);
const deleteAdjustment = new DeleteAdjustmentUseCase(repo);

export function useAdjustments() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdjustments.execute();
      setAdjustments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar ajustes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = useCallback(async (data: CreateAdjustmentData) => {
    const created = await createAdjustment.execute(data);
    setAdjustments(prev => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, data: UpdateAdjustmentData) => {
    const updated = await updateAdjustment.execute(id, data);
    setAdjustments(prev => prev.map(a => a.id === id ? updated : a));
    return updated;
  }, []);

  const confirm = useCallback(async (id: string) => {
    const confirmed = await confirmAdjustment.execute(id);
    setAdjustments(prev => prev.map(a => a.id === id ? confirmed : a));
    return confirmed;
  }, []);

  const cancel = useCallback(async (id: string) => {
    const cancelled = await cancelAdjustment.execute(id);
    setAdjustments(prev => prev.map(a => a.id === id ? cancelled : a));
    return cancelled;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteAdjustment.execute(id);
    setAdjustments(prev => prev.filter(a => a.id !== id));
  }, []);

  const deleteMany = useCallback(async (ids: string[]) => {
    await repo.deleteAll(ids);
    setAdjustments(prev => prev.filter(a => !ids.includes(a.id)));
  }, []);

  return { adjustments, loading, error, fetchAll, create, update, confirm, cancel, remove, deleteMany };
}
