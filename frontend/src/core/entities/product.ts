/**
 * Product entity - Pure domain model
 * No dependencies on infrastructure or presentation
 */

export type ProductStatus = 'ACTIVE' | 'ARCHIVED';
export type CostMethod = 'INHERIT' | 'STANDARD' | 'WAC' | 'FIFO';
export type UnitOfMeasure = 'UNIT' | 'KG' | 'L' | 'M' | 'M2' | 'BOX' | 'PACK';

export interface Product {
  id: string;
  sku: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  status: ProductStatus;
  costMethod: CostMethod;
  standardCost: number | null;
  salePrice: number | null;
  taxRate: number;
  reorderPoint: number | null;
  unitOfMeasure: UnitOfMeasure;
  createdAt: string;
  updatedAt: string;
  mainImage: string | null;
}

export interface CreateProductData {
  name: string;
  sku?: string | null;
  barcode?: string | null;
  description?: string | null;
  categoryId?: string | null;
  standardCost?: number | null;
  salePrice?: number | null;
  taxRate?: number;
  reorderPoint?: number | null;
  unitOfMeasure?: UnitOfMeasure;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  status?: ProductStatus;
  costMethod?: CostMethod;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  unitOfMeasure?: UnitOfMeasure;
  sortBy?: string;
  sortAsc?: boolean;
  page?: number;
  size?: number;
}
