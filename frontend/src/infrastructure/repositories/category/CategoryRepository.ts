/**
 * CategoryRepository - Adapter implementation of ICategoryRepository
 */

import { apiClient } from '../../api/client';
import { readWithCache } from '@/infrastructure/storage/networkAwareUtils';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { addToOutbox } from '@/infrastructure/storage/outbox';
import { getDB } from '@/infrastructure/storage/db';
import type { ICategoryRepository } from '@/core/category/ports/ICategoryRepository';
import type { Category, CreateCategoryData, UpdateCategoryData } from '@/core/category/entities/category';

export class CategoryRepository implements ICategoryRepository {
  private readonly basePath = '/api/v1/categories';

  async getAll(activeOnly = false): Promise<Category[]> {
    return readWithCache(
      async () => { const response = await apiClient.get<Category[]>(`${this.basePath}?activeOnly=${activeOnly}`); return response.data; },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async () => { const db = await getDB(); return db.getAll('categories') as any; },
    );
  }

  async getById(id: string): Promise<Category> {
    return readWithCache(
      async () => { const response = await apiClient.get<Category>(`${this.basePath}/${id}`); return response.data; },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async () => { const db = await getDB(); const item = await db.get('categories', id); if (!item) throw new Error('Category not found in cache'); return item as any; },
    );
  }

  async create(data: CreateCategoryData): Promise<Category> {
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      const response = await apiClient.post<Category>(this.basePath, data);
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Category>(this.basePath, data);
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'CATEGORY', entityId: `temp_${crypto.randomUUID()}`,
      action: 'CREATE', payload: data,
    });
    return { id: `temp_${crypto.randomUUID()}`, ...data } as unknown as Category;
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      const response = await apiClient.put<Category>(`${this.basePath}/${id}`, data);
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.put<Category>(`${this.basePath}/${id}`, data);
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
    if (mode === 'online-direct') {
      await apiClient.delete(`${this.basePath}/${id}`);
      return;
    }
    if (mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/${id}`);
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
    if (mode === 'online-direct') {
      await apiClient.delete(`${this.basePath}/batch`, { data: ids });
      return;
    }
    if (mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/batch`, { data: ids });
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
