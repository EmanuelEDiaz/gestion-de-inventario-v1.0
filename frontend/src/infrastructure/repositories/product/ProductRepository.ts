import { apiClient } from '../../api/client';
import type { IProductRepository, PaginatedResponse, CursorResponse } from '@/core/product/ports/IProductRepository';
import type { Product, CreateProductData, UpdateProductData, ProductFilters } from '@/core/product/entities/product';
import { getDB, safeCacheWrite } from '@/infrastructure/storage/db';
import { tryApiOrOutbox } from '@/infrastructure/repositories/shared/api-or-outbox';

export interface ProductQueryParams {
  cursor?: string | null;
  size?: number;
  activeOnly?: boolean;
  search?: string;
  categoryId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  unitOfMeasure?: string;
  sortBy?: string;
  sortAsc?: boolean;
}

export class ProductRepository implements IProductRepository {
  private readonly basePath = '/api/v1/products';

  private async getCachedAll(): Promise<Product[]> {
    const db = await getDB();
    return (await db.getAll('products')) as unknown as Product[];
  }

  private filterProducts(items: Product[], filters?: ProductFilters): Product[] {
    let filtered = items;
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q)
      );
    }
    if (filters?.categoryId) filtered = filtered.filter((p) => p.categoryId === filters.categoryId);
    if (filters?.status) filtered = filtered.filter((p) => p.status === filters.status);
    if (filters?.minPrice !== undefined) filtered = filtered.filter((p) => (p.salePrice ?? 0) >= filters.minPrice!);
    if (filters?.maxPrice !== undefined) filtered = filtered.filter((p) => (p.salePrice ?? 0) <= filters.maxPrice!);
    if (filters?.unitOfMeasure) filtered = filtered.filter((p) => p.unitOfMeasure === filters.unitOfMeasure);
    return filtered;
  }

  async getAllPaginated(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    const items = await this.getCachedAll();
    const filtered = this.filterProducts(items, filters);
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 20;
    const start = page * size;
    return {
      content: filtered.slice(start, start + size),
      totalElements: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / size)),
      size,
      number: page,
    };
  }

  async getAllWithCursor(): Promise<CursorResponse<Product>> {
    const items = await this.getCachedAll();
    return { items, nextCursor: null };
  }

  async getById(id: string): Promise<Product> {
    const db = await getDB();
    const cached = (await db.get('products', id)) as Product | undefined;
    if (!cached) throw new Error('Producto no encontrado en caché offline');
    return cached;
  }

  async create(data: CreateProductData): Promise<Product> {
    const id = `temp_${crypto.randomUUID()}`;
    return tryApiOrOutbox(
      async () => {
        const response = await apiClient.post<Product>(this.basePath, data);
        if (response.data) {
          await safeCacheWrite(async () => {
            const db = await getDB();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
            await db.put('products', { ...response.data, cachedAt: Date.now() } as any);
          }, 'ProductRepository.create');
        }
        return response.data;
      },
      { entityType: 'PRODUCT', entityId: id, action: 'CREATE', payload: data },
    );
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    return tryApiOrOutbox(
      async () => {
        const response = await apiClient.put<Product>(`${this.basePath}/${id}`, data);
        if (response.data) {
          await safeCacheWrite(async () => {
            const db = await getDB();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
            await db.put('products', { ...response.data, cachedAt: Date.now() } as any);
          }, 'ProductRepository.update');
        }
        return response.data;
      },
      { entityType: 'PRODUCT', entityId: id, action: 'UPDATE', payload: { id, ...data } },
    );
  }

  async delete(id: string): Promise<void> {
    return tryApiOrOutbox(
      async () => {
        await apiClient.delete(`${this.basePath}/${id}`);
        await safeCacheWrite(async () => {
          const db = await getDB();
          await db.delete('products', id);
        }, 'ProductRepository.delete');
      },
      { entityType: 'PRODUCT', entityId: id, action: 'DELETE', payload: { id } },
    );
  }

  async deleteAll(ids: string[]): Promise<void> {
    return tryApiOrOutbox(
      async () => {
        await apiClient.delete(`${this.basePath}/batch`, { data: ids });
        await safeCacheWrite(async () => {
          const db = await getDB();
          const tx = db.transaction('products', 'readwrite');
          for (const id of ids) await tx.store.delete(id);
          await tx.done;
        }, 'ProductRepository.deleteAll');
      },
      { entityType: 'PRODUCT', entityId: ids.join(','), action: 'DELETE', payload: { ids } },
    );
  }

  async archive(id: string): Promise<Product> {
    return tryApiOrOutbox(
      async () => {
        const response = await apiClient.post<Product>(`${this.basePath}/${id}/archive`);
        if (response.data) {
          await safeCacheWrite(async () => {
            const db = await getDB();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
            await db.put('products', { ...response.data, cachedAt: Date.now() } as any);
          }, 'ProductRepository.archive');
        }
        return response.data;
      },
      { entityType: 'PRODUCT', entityId: id, action: 'ARCHIVE', payload: { id } },
    );
  }

  async activate(id: string): Promise<Product> {
    return tryApiOrOutbox(
      async () => {
        const response = await apiClient.post<Product>(`${this.basePath}/${id}/activate`);
        if (response.data) {
          await safeCacheWrite(async () => {
            const db = await getDB();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
            await db.put('products', { ...response.data, cachedAt: Date.now() } as any);
          }, 'ProductRepository.activate');
        }
        return response.data;
      },
      { entityType: 'PRODUCT', entityId: id, action: 'ACTIVATE', payload: { id } },
    );
  }
}

export const productRepository = new ProductRepository();
