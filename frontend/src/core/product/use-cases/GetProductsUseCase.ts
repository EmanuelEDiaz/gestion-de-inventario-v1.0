/**
 * GetProductsUseCase - Retrieves products with optional filters
 * Single Responsibility: Only fetches products list
 */

import type { IProductRepository, PaginatedResponse } from '../ports/IProductRepository';
import type { Product, ProductFilters } from '../entities/product';

export class GetProductsUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    return this.productRepo.getAll(filters);
  }
}
