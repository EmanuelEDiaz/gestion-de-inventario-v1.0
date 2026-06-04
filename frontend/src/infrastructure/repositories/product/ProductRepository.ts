import { apiClient } from '../../api/client';
import type { IProductRepository, PaginatedResponse, CursorResponse } from '@/core/product/ports/IProductRepository';
import type { Product, CreateProductData, UpdateProductData, ProductFilters } from '@/core/product/entities/product';
import { readWithCache } from '@/infrastructure/storage/networkAwareUtils';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { addToOutbox } from '@/infrastructure/storage/outbox';
import { getCachedProducts, getCachedProduct, cacheProducts } from '@/infrastructure/storage/db';

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

const uuid = () => crypto.randomUUID();

export class ProductRepository implements IProductRepository {
  private readonly basePath = '/api/v1/products';

  private buildQueryString(params: ProductQueryParams): string {
    const urlParams = new URLSearchParams();
    if (params.cursor) urlParams.append('cursor', params.cursor);
    if (params.size) urlParams.append('size', params.size.toString());
    if (params.activeOnly !== undefined) urlParams.append('activeOnly', params.activeOnly.toString());
    if (params.search) urlParams.append('search', params.search);
    if (params.categoryId) urlParams.append('categoryId', params.categoryId);
    if (params.status) urlParams.append('status', params.status);
    if (params.minPrice !== undefined) urlParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) urlParams.append('maxPrice', params.maxPrice.toString());
    if (params.unitOfMeasure) urlParams.append('unitOfMeasure', params.unitOfMeasure);
    if (params.sortBy) urlParams.append('sortBy', params.sortBy);
    if (params.sortAsc !== undefined) urlParams.append('sortAsc', params.sortAsc.toString());
    return urlParams.toString();
  }

  async getAllPaginated(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    return readWithCache(
      async () => {
        const params = new URLSearchParams();
        if (filters?.search) params.append('search', filters.search);
        if (filters?.categoryId) params.append('categoryId', filters.categoryId);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
        if (filters?.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
        if (filters?.unitOfMeasure) params.append('unitOfMeasure', filters.unitOfMeasure);
        if (filters?.sortBy) params.append('sortBy', filters.sortBy);
        if (filters?.sortAsc !== undefined) params.append('sortAsc', filters.sortAsc.toString());
        if (filters?.page !== undefined) params.append('page', filters.page.toString());
        if (filters?.size !== undefined) params.append('size', filters.size.toString());
        const query = params.toString();
        const url = `${this.basePath}/paginated?${query}`;
        const response = await apiClient.get<PaginatedResponse<Product>>(url);
        return response.data;
      },
        async () => {
          const items = await getCachedProducts();
          let filtered = items as Product[];

          if (filters?.search) {
            const q = filters.search.toLowerCase();
            filtered = filtered.filter(p =>
              p.name?.toLowerCase().includes(q) ||
              p.sku?.toLowerCase().includes(q) ||
              p.barcode?.toLowerCase().includes(q)
            );
          }
          if (filters?.categoryId) {
            filtered = filtered.filter(p => p.categoryId === filters.categoryId);
          }
          if (filters?.status) {
            filtered = filtered.filter(p => p.status === filters.status);
          }
          if (filters?.minPrice !== undefined) {
            filtered = filtered.filter(p => (p.salePrice ?? 0) >= filters.minPrice!);
          }
          if (filters?.maxPrice !== undefined) {
            filtered = filtered.filter(p => (p.salePrice ?? 0) <= filters.maxPrice!);
          }
          if (filters?.unitOfMeasure) {
            filtered = filtered.filter(p => p.unitOfMeasure === filters.unitOfMeasure);
          }

          const page = filters?.page ?? 0;
          const size = filters?.size ?? 20;
          const start = page * size;
          const paged = filtered.slice(start, start + size);

          return {
            content: paged,
            totalElements: filtered.length,
            totalPages: Math.max(1, Math.ceil(filtered.length / size)),
            size,
            number: page,
          };
        },
    );
  }

  async getAllWithCursor(
    cursor: string | null,
    size: number,
    params: Omit<ProductQueryParams, 'cursor' | 'size'> = {},
  ): Promise<CursorResponse<Product>> {
    return readWithCache(
      async () => {
        const queryString = this.buildQueryString({ cursor, size, ...params });
        const url = `${this.basePath}?${queryString}`;
        const response = await apiClient.get<CursorResponse<Product>>(url);
        return response.data;
      },
        async () => {
          const items = await getCachedProducts();
          return { items, nextCursor: null, hasMore: false };
        },
    );
  }

  async getById(id: string): Promise<Product> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Product>(`${this.basePath}/${id}`);
        return response.data;
      },
      async () => {
        const cached = await getCachedProduct(id);
        if (!cached) throw new Error('Producto no encontrado en caché offline');
        return cached as Product;
      },
    );
  }

  async create(data: CreateProductData): Promise<Product> {
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      const response = await apiClient.post<Product>(this.basePath, data);
      if (response.data) await cacheProducts([response.data]);
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Product>(this.basePath, data);
        if (response.data) await cacheProducts([response.data]);
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    const id = `temp_${uuid()}`;
    await addToOutbox({
      operationId: uuid(), entityType: 'PRODUCT', entityId: id,
      action: 'CREATE', payload: data,
    });
    return { id, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), active: true } as unknown as Product;
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      const response = await apiClient.put<Product>(`${this.basePath}/${id}`, data);
      if (response.data) await cacheProducts([response.data]);
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.put<Product>(`${this.basePath}/${id}`, data);
        if (response.data) await cacheProducts([response.data]);
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: uuid(), entityType: 'PRODUCT', entityId: id,
      action: 'UPDATE', payload: { id, ...data },
    });
    return { id, ...data } as unknown as Product;
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
      operationId: uuid(), entityType: 'PRODUCT', entityId: id,
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
        operationId: uuid(), entityType: 'PRODUCT', entityId: id,
        action: 'DELETE', payload: { id },
      });
    }
  }

  async archive(id: string): Promise<Product> {
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      const response = await apiClient.post<Product>(`${this.basePath}/${id}/archive`);
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Product>(`${this.basePath}/${id}/archive`);
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: uuid(), entityType: 'PRODUCT', entityId: id,
      action: 'ARCHIVE', payload: { id },
    });
    return { id } as unknown as Product;
  }

  async activate(id: string): Promise<Product> {
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      const response = await apiClient.post<Product>(`${this.basePath}/${id}/activate`);
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Product>(`${this.basePath}/${id}/activate`);
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: uuid(), entityType: 'PRODUCT', entityId: id,
      action: 'ACTIVATE', payload: { id },
    });
    return { id } as unknown as Product;
  }
}

export const productRepository = new ProductRepository();
