/**
 * WarehouseRepository - Adapter implementation of IWarehouseRepository
 */

import { apiClient } from '../../api/client';
import { readWithCache } from '@/infrastructure/storage/networkAwareUtils';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { addToOutbox } from '@/infrastructure/storage/outbox';
import { getDB } from '@/infrastructure/storage/db';
import type { IWarehouseRepository } from '@/core/warehouse/ports/IWarehouseRepository';
import type { Warehouse, CreateWarehouseData, UpdateWarehouseData } from '@/core/warehouse/entities/warehouse';

export class WarehouseRepository implements IWarehouseRepository {
  private readonly basePath = '/api/v1/warehouses';

  async getAll(activeOnly = true): Promise<Warehouse[]> {
    return readWithCache(
      async () => { const response = await apiClient.get<Warehouse[]>(`${this.basePath}?activeOnly=${activeOnly}`); return response.data; },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async () => { const db = await getDB(); return db.getAll('warehouses') as any; },
    );
  }

  async getById(id: string): Promise<Warehouse> {
    return readWithCache(
      async () => { const response = await apiClient.get<Warehouse>(`${this.basePath}/${id}`); return response.data; },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async () => { const db = await getDB(); const item = (await db.get('warehouses', id)) as any; if (!item) throw new Error('Warehouse not found in cache'); return item; },
    );
  }

  async create(data: CreateWarehouseData): Promise<Warehouse> {
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      const response = await apiClient.post<Warehouse>(this.basePath, data);
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Warehouse>(this.basePath, data);
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'WAREHOUSE', entityId: `temp_${crypto.randomUUID()}`,
      action: 'CREATE', payload: data,
    });
    return { id: `temp_${crypto.randomUUID()}`, ...data } as unknown as Warehouse;
  }

  async update(id: string, data: UpdateWarehouseData): Promise<Warehouse> {
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      const response = await apiClient.put<Warehouse>(`${this.basePath}/${id}`, data);
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.put<Warehouse>(`${this.basePath}/${id}`, data);
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'WAREHOUSE', entityId: id,
      action: 'UPDATE', payload: data,
    });
    return { id, ...data } as unknown as Warehouse;
  }

  async activate(id: string): Promise<Warehouse> {
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      const response = await apiClient.post<Warehouse>(`${this.basePath}/${id}/activate`);
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Warehouse>(`${this.basePath}/${id}/activate`);
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'WAREHOUSE', entityId: id,
      action: 'ACTIVATE', payload: { id },
    });
    return { id, active: true } as unknown as Warehouse;
  }

  async deactivate(id: string): Promise<Warehouse> {
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      const response = await apiClient.post<Warehouse>(`${this.basePath}/${id}/deactivate`);
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Warehouse>(`${this.basePath}/${id}/deactivate`);
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'WAREHOUSE', entityId: id,
      action: 'DEACTIVATE', payload: { id },
    });
    return { id, active: false } as unknown as Warehouse;
  }
}

export const warehouseRepository = new WarehouseRepository();
