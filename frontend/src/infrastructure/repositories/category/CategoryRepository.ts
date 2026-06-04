/**
 * CategoryRepository - Adapter implementation of ICategoryRepository
 * Local-first: all reads from IDB. The boot loader (useAppLoader) keeps IDB fresh
 * via background sync (Fase D). Writes use the outbox when offline.
 */

import { apiClient } from '../../api/client';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { addToOutbox } from '@/infrastructure/storage/outbox';
import { getDB, safeCacheWrite } from '@/infrastructure/storage/db';
import type { ICategoryRepository } from '@/core/category/ports/ICategoryRepository';
import type { Category, CreateCategoryData, UpdateCategoryData } from '@/core/category/entities/category';

export class CategoryRepository implements ICategoryRepository {
  private readonly basePath = '/api/v1/categories';

  async getAll(_activeOnly = false): Promise<Category[]> {
    const db = await getDB();
    const all = (await db.getAll('categories')) as unknown as Category[];
    if (_activeOnly) return all.filter((c) => c.active !== false);
    return all;
  }

  async getById(id: string): Promise<Category> {
    const db = await getDB();
    const cached = (await db.get('categories', id)) as Category | undefined;
    if (!cached) throw new Error('Category not found in cache');
    return cached;
  }

  async create(data: CreateCategoryData): Promise<Category> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Category>(this.basePath, data);
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('categories', { ...response.data, cachedAt: Date.now() } as any);
        }, 'CategoryRepository.create');
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    const id = `temp_${crypto.randomUUID()}`;
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'CATEGORY', entityId: id,
      action: 'CREATE', payload: data,
    });
    return { id, ...data } as unknown as Category;
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        const response = await apiClient.put<Category>(`${this.basePath}/${id}`, data);
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('categories', { ...response.data, cachedAt: Date.now() } as any);
        }, 'CategoryRepository.update');
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'CATEGORY', entityId: id,
      action: 'UPDATE', payload: data,
    });
    return { id, ...data } as unknown as Category;
  }

  async delete(id: string): Promise<void> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/${id}`);
        await safeCacheWrite(async () => {
          const db = await getDB();
          await db.delete('categories', id);
        }, 'CategoryRepository.delete');
        return;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'CATEGORY', entityId: id,
      action: 'DELETE', payload: { id },
    });
  }

  async deleteAll(ids: string[]): Promise<void> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/batch`, { data: ids });
        await safeCacheWrite(async () => {
          const db = await getDB();
          const tx = db.transaction('categories', 'readwrite');
          for (const id of ids) await tx.store.delete(id);
          await tx.done;
        }, 'CategoryRepository.deleteAll');
        return;
      } catch {
        // fall through to outbox
      }
    }
    for (const id of ids) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'CATEGORY', entityId: id,
        action: 'DELETE', payload: { id },
      });
    }
  }
}

export const categoryRepository = new CategoryRepository();
