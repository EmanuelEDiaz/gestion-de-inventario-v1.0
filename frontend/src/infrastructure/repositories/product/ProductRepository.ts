import { apiClient } from '../../api/client';
import type { IProductRepository, PaginatedResponse, CursorResponse } from '@/core/product/ports/IProductRepository';
import type { Product, CreateProductData, UpdateProductData, ProductFilters } from '@/core/product/entities/product';
import { isOnline, readWithCache } from '@/infrastructure/storage/networkAwareUtils';
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

  async getAll(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    return readWithCache(
      async () => {
        const params = new URLSearchParams();
        if (filters?.search) params.append('search', filters.search);
        if (filters?.categoryId) params.append('categoryId', filters.categoryId);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.page !== undefined) params.append('page', filters.page.toString());
        if (filters?.size !== undefined) params.append('size', filters.size.toString());
        const query = params.toString();
        const url = query ? `${this.basePath}?${query}` : this.basePath;
        const response = await apiClient.get<PaginatedResponse<Product>>(url);
        return response.data;
      },
        async () => {
          const items = await getCachedProducts();
          return { content: items as unknown as Product[], totalElements: items.length, totalPages: 1, size: items.length, number: 0 };
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
          return { items: items as unknown as Product[], nextCursor: null, hasMore: false };
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
        return cached as unknown as Product;
      },
    );
  }

  async create(data: CreateProductData): Promise<Product> {
    if (!isOnline()) {
      const id = `temp_${uuid()}`;
      await addToOutbox({
        operationId: uuid(), entityType: 'PRODUCT', entityId: id,
        action: 'CREATE', payload: data,
      });
      return { id, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), active: true } as unknown as Product;
    }
    const response = await apiClient.post<Product>(this.basePath, data);
    if (response.data) await cacheProducts([response.data as unknown as Parameters<typeof cacheProducts>[0][0]]);
    return response.data;
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: uuid(), entityType: 'PRODUCT', entityId: id,
        action: 'UPDATE', payload: { id, ...data },
      });
      return { id, ...data } as unknown as Product;
    }
    const response = await apiClient.put<Product>(`${this.basePath}/${id}`, data);
    if (response.data) await cacheProducts([response.data as unknown as Parameters<typeof cacheProducts>[0][0]]);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: uuid(), entityType: 'PRODUCT', entityId: id,
        action: 'DELETE', payload: { id },
      });
      return;
    }
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async deleteAll(ids: string[]): Promise<void> {
    if (!isOnline()) {
      for (const id of ids) {
        await addToOutbox({
          operationId: uuid(), entityType: 'PRODUCT', entityId: id,
          action: 'DELETE', payload: { id },
        });
      }
      return;
    }
    await apiClient.delete(`${this.basePath}/batch`, { data: ids });
  }

  async archive(id: string): Promise<Product> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: uuid(), entityType: 'PRODUCT', entityId: id,
        action: 'ARCHIVE', payload: { id },
      });
      return { id } as unknown as Product;
    }
    const response = await apiClient.post<Product>(`${this.basePath}/${id}/archive`);
    return response.data;
  }

  async activate(id: string): Promise<Product> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: uuid(), entityType: 'PRODUCT', entityId: id,
        action: 'ACTIVATE', payload: { id },
      });
      return { id } as unknown as Product;
    }
    const response = await apiClient.post<Product>(`${this.basePath}/${id}/activate`);
    return response.data;
  }
}

export const productRepository = new ProductRepository();
