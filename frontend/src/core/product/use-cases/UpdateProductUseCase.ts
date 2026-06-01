import type { IProductRepository } from '../ports/IProductRepository';
import type { Product, UpdateProductData } from '../entities/product';
import { ProductValidationError, ProductNotFoundError } from '../../errors/ProductErrors';

export class UpdateProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(id: string, data: UpdateProductData): Promise<Product> {
    if (!id) throw new ProductValidationError('ID del producto es requerido');
    if (data.name !== undefined) {
      if (!data.name.trim()) throw new ProductValidationError('El nombre del producto es requerido');
      if (data.name.length > 200) throw new ProductValidationError('El nombre no puede exceder 200 caracteres');
    }
    if (data.sku !== undefined && data.sku != null && data.sku.length > 50) {
      throw new ProductValidationError('El SKU no puede exceder 50 caracteres');
    }
    if (data.barcode !== undefined && data.barcode != null) {
      if (data.barcode.length > 50) throw new ProductValidationError('El código de barras no puede exceder 50 caracteres');
      if (!/^\d+$/.test(data.barcode)) throw new ProductValidationError('El código de barras debe contener solo números');
      if (data.barcode.length < 8) throw new ProductValidationError('El código de barras debe tener al menos 8 dígitos');
    }
    if (data.description !== undefined && data.description != null && data.description.length > 2000) {
      throw new ProductValidationError('La descripción no puede exceder 2000 caracteres');
    }
    if (data.standardCost != null && data.standardCost < 0) {
      throw new ProductValidationError('El costo estándar no puede ser negativo');
    }
    if (data.salePrice != null && data.salePrice < 0) {
      throw new ProductValidationError('El precio de venta no puede ser negativo');
    }
    if (data.reorderPoint != null && data.reorderPoint < 0) {
      throw new ProductValidationError('El punto de reorden no puede ser negativo');
    }
    if (data.taxRate != null && (data.taxRate < 0 || data.taxRate > 100)) {
      throw new ProductValidationError('La tasa de impuesto debe estar entre 0 y 100');
    }
    try {
      return await this.productRepo.update(id, data);
    } catch (e) {
      if (e instanceof ProductNotFoundError) throw e;
      throw new ProductNotFoundError(id);
    }
  }
}
