import { describe, it, expect, vi } from 'vitest';
import { GetProductsUseCase } from './GetProductsUseCase';
import type { IProductRepository, PaginatedResponse } from '../ports/IProductRepository';
import type { Product } from '../entities/product';

describe('GetProductsUseCase', () => {
  it('should return paginated products from repository', async () => {
    const mockResponse: PaginatedResponse<Product> = {
      content: [
        { id: '1', name: 'Product 1', status: 'ACTIVE', sku: null, barcode: null, description: null, categoryId: null, categoryName: null, costMethod: 'STANDARD', standardCost: null, salePrice: null, taxRate: 0, reorderPoint: null, unitOfMeasure: 'UNIT', createdAt: '', updatedAt: '' },
        { id: '2', name: 'Product 2', status: 'ACTIVE', sku: null, barcode: null, description: null, categoryId: null, categoryName: null, costMethod: 'STANDARD', standardCost: null, salePrice: null, taxRate: 0, reorderPoint: null, unitOfMeasure: 'UNIT', createdAt: '', updatedAt: '' },
      ],
      totalElements: 2,
      totalPages: 1,
      size: 20,
      number: 0,
    };

    const mockRepo = {
      getAll: vi.fn().mockResolvedValue(mockResponse),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as IProductRepository;

    const useCase = new GetProductsUseCase(mockRepo);
    const result = await useCase.execute({ page: 0, size: 20 });

    expect(result.content).toHaveLength(2);
    expect(result.totalElements).toBe(2);
    expect(mockRepo.getAll).toHaveBeenCalledWith({ page: 0, size: 20 });
  });

  it('should pass filters to repository', async () => {
    const mockResponse: PaginatedResponse<Product> = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
    };

    const mockRepo = {
      getAll: vi.fn().mockResolvedValue(mockResponse),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as IProductRepository;

    const useCase = new GetProductsUseCase(mockRepo);
    await useCase.execute({ search: 'test', status: 'ACTIVE', page: 1, size: 10 });

    expect(mockRepo.getAll).toHaveBeenCalledWith({
      search: 'test',
      status: 'ACTIVE',
      page: 1,
      size: 10,
    });
  });

  it('should work without filters', async () => {
    const mockResponse: PaginatedResponse<Product> = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
    };

    const mockRepo = {
      getAll: vi.fn().mockResolvedValue(mockResponse),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as IProductRepository;

    const useCase = new GetProductsUseCase(mockRepo);
    const result = await useCase.execute();

    expect(mockRepo.getAll).toHaveBeenCalledWith(undefined);
    expect(result.content).toHaveLength(0);
  });
});