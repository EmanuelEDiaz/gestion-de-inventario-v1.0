import { describe, it, expect } from 'vitest';
import type { Product, CreateProductData, UpdateProductData, ProductFilters, ProductStatus, CostMethod, UnitOfMeasure } from './product';

describe('Product Entity', () => {
  const mockProduct: Product = {
    id: '123',
    sku: 'SKU-001',
    barcode: '123456789',
    name: 'Test Product',
    description: 'A test product description',
    categoryId: 'cat-1',
    categoryName: 'Electronics',
    status: 'ACTIVE' as ProductStatus,
    costMethod: 'STANDARD' as CostMethod,
    standardCost: 100.50,
    salePrice: 150.00,
    taxRate: 10,
    reorderPoint: 10,
    unitOfMeasure: 'UNIT' as UnitOfMeasure,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  };

  it('should create a valid product', () => {
    expect(mockProduct.id).toBe('123');
    expect(mockProduct.name).toBe('Test Product');
    expect(mockProduct.status).toBe('ACTIVE');
  });

  it('should validate ProductStatus values', () => {
    expect(mockProduct.status).toMatch(/ACTIVE|ARCHIVED/);
  });

  it('should validate CostMethod values', () => {
    const validCostMethods: CostMethod[] = ['INHERIT', 'STANDARD', 'WAC', 'FIFO'];
    expect(validCostMethods).toContain(mockProduct.costMethod);
  });

  it('should validate UnitOfMeasure values', () => {
    const validUnits: UnitOfMeasure[] = ['UNIT', 'KG', 'L', 'M', 'M2', 'BOX', 'PACK'];
    expect(validUnits).toContain(mockProduct.unitOfMeasure);
  });

  it('should handle nullable fields', () => {
    const productWithoutOptional: Product = {
      ...mockProduct,
      sku: null,
      barcode: null,
      description: null,
      categoryId: null,
      categoryName: null,
      standardCost: null,
      salePrice: null,
      reorderPoint: null,
    };
    expect(productWithoutOptional.sku).toBeNull();
    expect(productWithoutOptional.standardCost).toBeNull();
  });
});

describe('CreateProductData', () => {
  it('should accept valid create data', () => {
    const createData: CreateProductData = {
      name: 'New Product',
      sku: 'SKU-002',
      barcode: '987654321',
      description: 'New product description',
      categoryId: 'cat-2',
      standardCost: 50.00,
      salePrice: 75.00,
      taxRate: 5,
      reorderPoint: 5,
      unitOfMeasure: 'KG',
    };
    expect(createData.name).toBe('New Product');
    expect(createData.unitOfMeasure).toBe('KG');
  });

  it('should allow partial data', () => {
    const createData: CreateProductData = {
      name: 'Minimal Product',
    };
    expect(createData.name).toBe('Minimal Product');
    expect(createData.sku).toBeUndefined();
  });
});

describe('UpdateProductData', () => {
  it('should extend CreateProductData with status and costMethod', () => {
    const updateData: UpdateProductData = {
      name: 'Updated Product',
      status: 'ARCHIVED',
      costMethod: 'WAC',
    };
    expect(updateData.name).toBe('Updated Product');
    expect(updateData.status).toBe('ARCHIVED');
    expect(updateData.costMethod).toBe('WAC');
  });
});

describe('ProductFilters', () => {
  it('should handle filter parameters', () => {
    const filters: ProductFilters = {
      search: 'test',
      categoryId: 'cat-1',
      status: 'ACTIVE',
      page: 1,
      size: 20,
    };
    expect(filters.search).toBe('test');
    expect(filters.page).toBe(1);
    expect(filters.size).toBe(20);
  });

  it('should allow optional filter fields', () => {
    const filters: ProductFilters = {};
    expect(filters.search).toBeUndefined();
    expect(filters.status).toBeUndefined();
  });
});