'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Supplier, CreateSupplierData, UpdateSupplierData } from '@/core/entities/supplier';
import { SupplierRepository } from '@/infrastructure/repositories/SupplierRepository';
import { GetSuppliersUseCase, CreateSupplierUseCase, UpdateSupplierUseCase, ActivateSupplierUseCase, DeactivateSupplierUseCase, DeleteSupplierUseCase } from '@/core/use-cases/supplier';

// Singletons
const repo = new SupplierRepository();
const getSuppliers = new GetSuppliersUseCase(repo);
const createSupplier = new CreateSupplierUseCase(repo);
const updateSupplier = new UpdateSupplierUseCase(repo);
const activateSupplier = new ActivateSupplierUseCase(repo);
const deactivateSupplier = new DeactivateSupplierUseCase(repo);
const deleteSupplier = new DeleteSupplierUseCase(repo);

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSuppliers.execute();
      setSuppliers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = useCallback(async (data: CreateSupplierData) => {
    const created = await createSupplier.execute(data);
    setSuppliers(prev => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, data: UpdateSupplierData) => {
    const updated = await updateSupplier.execute(id, data);
    setSuppliers(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  }, []);

  const activate = useCallback(async (id: string) => {
    const activated = await activateSupplier.execute(id);
    setSuppliers(prev => prev.map(s => s.id === id ? activated : s));
    return activated;
  }, []);

  const deactivate = useCallback(async (id: string) => {
    const deactivated = await deactivateSupplier.execute(id);
    setSuppliers(prev => prev.map(s => s.id === id ? deactivated : s));
    return deactivated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteSupplier.execute(id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
  }, []);

  return { suppliers, loading, error, fetchAll, create, update, activate, deactivate, remove };
}
