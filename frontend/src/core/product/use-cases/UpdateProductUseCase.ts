/**
 * UpdateProductUseCase - Updates an existing product
 */

import type { IProductRepository } from '../ports/IProductRepository';
import type { Product, UpdateProductData } from '../entities/product';
import { ProductValidationError, ProductNotFoundError } from '../../errors/ProductErrors';

export class UpdateProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(id: string, data: UpdateProductData): Promise<Product> {
    if (!id) throw new ProductValidationError('ID del producto es requerido');
    try {
      return await this.productRepo.update(id, data);
    } catch (e) {
      if (e instanceof ProductNotFoundError) throw e;
      throw new ProductNotFoundError(id);
    }
  }
}
