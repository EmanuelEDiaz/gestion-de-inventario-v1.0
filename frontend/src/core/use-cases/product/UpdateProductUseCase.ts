/**
 * UpdateProductUseCase - Updates an existing product
 */

import type { IProductRepository } from '../../interfaces/IProductRepository';
import type { Product, UpdateProductData } from '../../entities/product';

export class UpdateProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(id: string, data: UpdateProductData): Promise<Product> {
    if (!id) throw new Error('ID del producto es requerido');
    return this.productRepo.update(id, data);
  }
}
