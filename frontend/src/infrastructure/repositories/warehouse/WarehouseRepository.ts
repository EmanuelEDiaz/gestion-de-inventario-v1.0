/**
 * WarehouseRepository - Adapter implementation of IWarehouseRepository
 * Local-first: all reads from IDB. The boot loader (useAppLoader) keeps IDB fresh
 * via background sync (Fase D). Writes use the outbox when offline.
 */

import { apiClient } from '../../api/client';
import { getDB, safeCacheWrite } from '@/infrastructure/storage/db';
import type { IWarehouseRepository } from '@/core/warehouse/ports/IWarehouseRepository';
import type { Warehouse, CreateWarehouseData, UpdateWarehouseData } from '@/core/warehouse/entities/warehouse';
import { tryApiOrOutbox } from '@/infrastructure/repositories/shared/api-or-outbox';

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
    const id = `temp_${crypto.randomUUID()}`;
    return tryApiOrOutbox(
      async () => {
        const response = await apiClient.post<Warehouse>(this.basePath, data);
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('warehouses', { ...response.data, cachedAt: Date.now() } as any);
        }, 'WarehouseRepository.create');
        return response.data;
      },
      { entityType: 'WAREHOUSE', entityId: id, action: 'CREATE', payload: data },
    );
  }

  async update(id: string, data: UpdateWarehouseData): Promise<Warehouse> {
    return tryApiOrOutbox(
      async () => {
        const response = await apiClient.put<Warehouse>(`${this.basePath}/${id}`, data);
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('warehouses', { ...response.data, cachedAt: Date.now() } as any);
        }, 'WarehouseRepository.update');
        return response.data;
      },
      { entityType: 'WAREHOUSE', entityId: id, action: 'UPDATE', payload: data },
    );
  }

  async activate(id: string): Promise<Warehouse> {
    return tryApiOrOutbox(
      async () => {
        const response = await apiClient.post<Warehouse>(`${this.basePath}/${id}/activate`);
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('warehouses', { ...response.data, cachedAt: Date.now() } as any);
        }, 'WarehouseRepository.activate');
        return response.data;
      },
      { entityType: 'WAREHOUSE', entityId: id, action: 'ACTIVATE', payload: { id } },
    );
  }

  async deactivate(id: string): Promise<Warehouse> {
    return tryApiOrOutbox(
      async () => {
        const response = await apiClient.post<Warehouse>(`${this.basePath}/${id}/deactivate`);
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('warehouses', { ...response.data, cachedAt: Date.now() } as any);
        }, 'WarehouseRepository.deactivate');
        return response.data;
      },
      { entityType: 'WAREHOUSE', entityId: id, action: 'DEACTIVATE', payload: { id } },
    );
  }
}

export const warehouseRepository = new WarehouseRepository();
