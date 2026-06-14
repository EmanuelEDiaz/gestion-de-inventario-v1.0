/**
 * CategoryRepository - Adapter implementation of ICategoryRepository
 * Local-first: all reads from IDB. The boot loader (useAppLoader) keeps IDB fresh
 * via background sync (Fase D). Writes use the outbox when offline.
 */

import { apiClient } from '../../api/client';
import { getDB, safeCacheWrite } from '@/infrastructure/storage/db';
import type { ICategoryRepository } from '@/core/category/ports/ICategoryRepository';
import type { Category, CreateCategoryData, UpdateCategoryData } from '@/core/category/entities/category';
import { tryApiOrOutbox } from '@/infrastructure/repositories/shared/api-or-outbox';

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
    const id = `temp_${crypto.randomUUID()}`;
    return tryApiOrOutbox(
      async () => {
        const response = await apiClient.post<Category>(this.basePath, data);
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('categories', { ...response.data, cachedAt: Date.now() } as any);
        }, 'CategoryRepository.create');
        return response.data;
      },
      { entityType: 'CATEGORY', entityId: id, action: 'CREATE', payload: data },
    );
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    return tryApiOrOutbox(
      async () => {
        const response = await apiClient.put<Category>(`${this.basePath}/${id}`, data);
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('categories', { ...response.data, cachedAt: Date.now() } as any);
        }, 'CategoryRepository.update');
        return response.data;
      },
      { entityType: 'CATEGORY', entityId: id, action: 'UPDATE', payload: data },
    );
  }

  async delete(id: string): Promise<void> {
    return tryApiOrOutbox(
      async () => {
        await apiClient.delete(`${this.basePath}/${id}`);
        await safeCacheWrite(async () => {
          const db = await getDB();
          await db.delete('categories', id);
        }, 'CategoryRepository.delete');
      },
      { entityType: 'CATEGORY', entityId: id, action: 'DELETE', payload: { id } },
    );
  }

  async deleteAll(ids: string[]): Promise<void> {
    return tryApiOrOutbox(
      async () => {
        await apiClient.delete(`${this.basePath}/batch`, { data: ids });
        await safeCacheWrite(async () => {
          const db = await getDB();
          const tx = db.transaction('categories', 'readwrite');
          for (const id of ids) await tx.store.delete(id);
          await tx.done;
        }, 'CategoryRepository.deleteAll');
      },
      { entityType: 'CATEGORY', entityId: ids.join(','), action: 'DELETE', payload: { ids } },
    );
  }
}

export const categoryRepository = new CategoryRepository();
