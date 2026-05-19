/**
 * CreateProductUseCase - Creates a new product
 * Single Responsibility: Only creates products
 */

import type { IProductRepository } from '../../interfaces/IProductRepository';
import type { Product, CreateProductData } from '../../entities/product';
import { ProductValidationError } from '../../errors/ProductErrors';

export class CreateProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(data: CreateProductData): Promise<Product> {
    if (!data.name?.trim()) {
      throw new ProductValidationError('El nombre del producto es requerido');
    }
    return this.productRepo.create(data);
  }
}
