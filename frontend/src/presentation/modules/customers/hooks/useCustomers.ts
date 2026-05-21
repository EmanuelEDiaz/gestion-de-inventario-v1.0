'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Customer, CreateCustomerData, UpdateCustomerData } from '@/core/customer/entities/customer';
import { CustomerRepository } from '@/infrastructure/repositories/customer/CustomerRepository';
import { GetCustomersUseCase, CreateCustomerUseCase, UpdateCustomerUseCase, ActivateCustomerUseCase, DeactivateCustomerUseCase, DeleteCustomerUseCase } from '@/core/customer/use-cases';

// Singletons
const repo = new CustomerRepository();
const getCustomers = new GetCustomersUseCase(repo);
const createCustomer = new CreateCustomerUseCase(repo);
const updateCustomer = new UpdateCustomerUseCase(repo);
const activateCustomer = new ActivateCustomerUseCase(repo);
const deactivateCustomer = new DeactivateCustomerUseCase(repo);
const deleteCustomer = new DeleteCustomerUseCase(repo);

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomers.execute();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = useCallback(async (data: CreateCustomerData) => {
    const created = await createCustomer.execute(data);
    setCustomers(prev => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, data: UpdateCustomerData) => {
    const updated = await updateCustomer.execute(id, data);
    setCustomers(prev => prev.map(c => c.id === id ? updated : c));
    return updated;
  }, []);

  const activate = useCallback(async (id: string) => {
    const activated = await activateCustomer.execute(id);
    setCustomers(prev => prev.map(c => c.id === id ? activated : c));
    return activated;
  }, []);

  const deactivate = useCallback(async (id: string) => {
    const deactivated = await deactivateCustomer.execute(id);
    setCustomers(prev => prev.map(c => c.id === id ? deactivated : c));
    return deactivated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteCustomer.execute(id);
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, []);

  return { customers, loading, error, fetchAll, create, update, activate, deactivate, remove };
}
