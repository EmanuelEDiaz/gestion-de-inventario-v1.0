/**
 * IProductRepository - Port for product data access
 * Domain depends on this interface, not the implementation
 */

import type { Product, CreateProductData, UpdateProductData, ProductFilters } from '../entities/product';

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface IProductRepository {
  getAll(filters?: ProductFilters): Promise<PaginatedResponse<Product>>;
  getById(id: string): Promise<Product>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  delete(id: string): Promise<void>;
  archive(id: string): Promise<Product>;
  activate(id: string): Promise<Product>;
}
