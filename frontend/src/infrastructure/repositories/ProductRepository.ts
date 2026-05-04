/**
 * ProductRepository - Adapter implementation of IProductRepository
 * Handles HTTP communication with the backend API
 * 
 * TODO: Agregar persistencia IndexedDB para modo offline
 * - INVESTIGAR: ¿implementar cache de productos para consulta offline?
 * - INVESTIGAR: ¿guardar create/update/delete en outbox para sync posterior?
 * - Login NO puede ejecutarse offline
 */

import { apiClient } from '../api/client';
import type { IProductRepository, PaginatedResponse, CursorResponse } from '@/core/interfaces/IProductRepository';
import type { Product, CreateProductData, UpdateProductData, ProductFilters } from '@/core/entities/product';

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
  }

  async getAllWithCursor(
    cursor: string | null, 
    size: number,
    params: Omit<ProductQueryParams, 'cursor' | 'size'> = {}
  ): Promise<CursorResponse<Product>> {
    const queryString = this.buildQueryString({ cursor, size, ...params });
    const url = `${this.basePath}?${queryString}`;
    const response = await apiClient.get<CursorResponse<Product>>(url);
    return response.data;
  }

  async getById(id: string): Promise<Product> {
    const response = await apiClient.get<Product>(`${this.basePath}/${id}`);
    return response.data;
  }

  async create(data: CreateProductData): Promise<Product> {
    const response = await apiClient.post<Product>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    const response = await apiClient.put<Product>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async archive(id: string): Promise<Product> {
    const response = await apiClient.post<Product>(`${this.basePath}/${id}/archive`);
    return response.data;
  }

  async activate(id: string): Promise<Product> {
    const response = await apiClient.post<Product>(`${this.basePath}/${id}/activate`);
    return response.data;
  }
}

// Singleton instance for dependency injection
export const productRepository = new ProductRepository();
