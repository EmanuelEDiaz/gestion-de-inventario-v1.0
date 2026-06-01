import type { IProductRepository } from '../ports/IProductRepository';
import type { Product, CreateProductData } from '../entities/product';
import { ProductValidationError } from '../../errors/ProductErrors';

export class CreateProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(data: CreateProductData): Promise<Product> {
    if (!data.name?.trim()) {
      throw new ProductValidationError('El nombre del producto es requerido');
    }
    if (data.name && data.name.length > 200) {
      throw new ProductValidationError('El nombre no puede exceder 200 caracteres');
    }
    if (data.sku && data.sku.length > 50) {
      throw new ProductValidationError('El SKU no puede exceder 50 caracteres');
    }
    if (data.barcode && data.barcode.length > 50) {
      throw new ProductValidationError('El código de barras no puede exceder 50 caracteres');
    }
    if (data.barcode && !/^\d+$/.test(data.barcode)) {
      throw new ProductValidationError('El código de barras debe contener solo números');
    }
    if (data.barcode && data.barcode.length < 8) {
      throw new ProductValidationError('El código de barras debe tener al menos 8 dígitos');
    }
    if (data.description && data.description.length > 2000) {
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
    return this.productRepo.create(data);
  }
}
