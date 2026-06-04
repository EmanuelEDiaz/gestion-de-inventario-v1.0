/**
 * WarehouseRepository - Adapter implementation of IWarehouseRepository
 * Local-first: all reads from IDB. The boot loader (useAppLoader) keeps IDB fresh
 * via background sync (Fase D). Writes use the outbox when offline.
 */

import { apiClient } from '../../api/client';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { addToOutbox } from '@/infrastructure/storage/outbox';
import { getDB, safeCacheWrite } from '@/infrastructure/storage/db';
import type { IWarehouseRepository } from '@/core/warehouse/ports/IWarehouseRepository';
import type { Warehouse, CreateWarehouseData, UpdateWarehouseData } from '@/core/warehouse/entities/warehouse';

export class WarehouseRepository implements IWarehouseRepository {
  private readonly basePath = '/api/v1/warehouses';

  async getAll(activeOnly = true): Promise<Warehouse[]> {
    const db = await getDB();
    const all = (await db.getAll('warehouses')) as unknown as Warehouse[];
    if (activeOnly) return all.filter((w) => w.active !== false);
    return all;
  }

  async getById(id: string): Promise<Warehouse> {
    const db = await getDB();
    const item = (await db.get('warehouses', id)) as Warehouse | undefined;
    if (!item) throw new Error('Warehouse not found in cache');
    return item;
  }

  async create(data: CreateWarehouseData): Promise<Warehouse> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Warehouse>(this.basePath, data);
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('warehouses', { ...response.data, cachedAt: Date.now() } as any);
        }, 'WarehouseRepository.create');
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    const id = `temp_${crypto.randomUUID()}`;
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'WAREHOUSE', entityId: id,
      action: 'CREATE', payload: data,
    });
    return { id, ...data } as unknown as Warehouse;
  }

  async update(id: string, data: UpdateWarehouseData): Promise<Warehouse> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        const response = await apiClient.put<Warehouse>(`${this.basePath}/${id}`, data);
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('warehouses', { ...response.data, cachedAt: Date.now() } as any);
        }, 'WarehouseRepository.update');
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
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Warehouse>(`${this.basePath}/${id}/activate`);
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('warehouses', { ...response.data, cachedAt: Date.now() } as any);
        }, 'WarehouseRepository.activate');
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
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Warehouse>(`${this.basePath}/${id}/deactivate`);
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('warehouses', { ...response.data, cachedAt: Date.now() } as any);
        }, 'WarehouseRepository.deactivate');
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
