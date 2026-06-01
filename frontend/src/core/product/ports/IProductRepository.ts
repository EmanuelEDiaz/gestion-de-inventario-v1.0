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

export interface CursorResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export interface IProductRepository {
  getAllPaginated(filters?: ProductFilters): Promise<PaginatedResponse<Product>>;
  getAllWithCursor(cursor: string | null, size: number): Promise<CursorResponse<Product>>;
  getById(id: string): Promise<Product>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  delete(id: string): Promise<void>;
  deleteAll(ids: string[]): Promise<void>;
  archive(id: string): Promise<Product>;
  activate(id: string): Promise<Product>;
}
