import { describe, it, expect, vi } from 'vitest';
import { CreateProductUseCase } from './CreateProductUseCase';
import type { IProductRepository } from '../../interfaces/IProductRepository';
import type { Product, CreateProductData } from '../../entities/product';

describe('CreateProductUseCase', () => {
  it('should create a product via repository', async () => {
    const createData: CreateProductData = {
      name: 'New Product',
      sku: 'SKU-001',
      barcode: '123456789',
      description: 'A new product',
      categoryId: 'cat-1',
      standardCost: 50.00,
      salePrice: 75.00,
      taxRate: 10,
      reorderPoint: 5,
      unitOfMeasure: 'UNIT',
    };

    const createdProduct: Product = {
      id: 'new-id',
      ...createData,
      categoryName: 'Electronics',
      status: 'ACTIVE',
      costMethod: 'STANDARD',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const mockRepo = {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn().mockResolvedValue(createdProduct),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as IProductRepository;

    const useCase = new CreateProductUseCase(mockRepo);
    const result = await useCase.execute(createData);

    expect(result.name).toBe('New Product');
    expect(mockRepo.create).toHaveBeenCalledWith(createData);
  });

  it('should handle minimal product data', async () => {
    const createData: CreateProductData = {
      name: 'Minimal Product',
    };

    const createdProduct: Product = {
      id: 'new-id',
      ...createData,
      sku: null,
      barcode: null,
      description: null,
      categoryId: null,
      categoryName: null,
      status: 'ACTIVE',
      costMethod: 'INHERIT',
      standardCost: null,
      salePrice: null,
      taxRate: 0,
      reorderPoint: null,
      unitOfMeasure: 'UNIT',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const mockRepo = {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn().mockResolvedValue(createdProduct),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as IProductRepository;

    const useCase = new CreateProductUseCase(mockRepo);
    const result = await useCase.execute(createData);

    expect(result.name).toBe('Minimal Product');
    expect(result.status).toBe('ACTIVE');
  });
});