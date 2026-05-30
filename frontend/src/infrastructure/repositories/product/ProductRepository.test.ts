import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductRepository } from './ProductRepository';
import { apiClient } from '../../api/client';
import type { Product, CreateProductData, UpdateProductData, ProductFilters } from '@/core/product/entities/product';

vi.mock('../../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ProductRepository', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new ProductRepository();
  });

  describe('getAll', () => {
    it('should fetch products with filters', async () => {
      const mockResponse = {
        data: {
          content: [{ id: '1', name: 'Product 1', status: 'ACTIVE' as const, sku: null, barcode: null, description: null, categoryId: null, categoryName: null, costMethod: 'STANDARD' as const, standardCost: null, salePrice: null, taxRate: 0, reorderPoint: null, unitOfMeasure: 'UNIT' as const, mainImage: null, createdAt: '', updatedAt: '' }],
          totalElements: 1,
          totalPages: 1,
          size: 20,
          number: 0,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await repository.getAll({ search: 'test', page: 0, size: 20 });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/products?search=test&page=0&size=20');
      expect(result.content).toHaveLength(1);
      expect(result.totalElements).toBe(1);
    });

    it('should fetch products without filters', async () => {
      const mockResponse = {
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 20,
          number: 0,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await repository.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/products');
      expect(result.content).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('should fetch product by id', async () => {
      const mockProduct: Product = {
        id: '1',
        name: 'Test Product',
        status: 'ACTIVE',
        sku: 'SKU-001',
        barcode: null,
        description: null,
        categoryId: null,
        categoryName: null,
        costMethod: 'STANDARD',
        standardCost: null,
        salePrice: null,
        taxRate: 0,
        reorderPoint: null,
        unitOfMeasure: 'UNIT',
        mainImage: null,
        createdAt: '',
        updatedAt: '',
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockProduct });

      const result = await repository.getById('1');

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/products/1');
      expect(result.id).toBe('1');
      expect(result.name).toBe('Test Product');
    });
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createData: CreateProductData = {
        name: 'New Product',
        sku: 'SKU-001',
      };

      const createdProduct = {
        id: 'new-id',
        ...createData,
        status: 'ACTIVE',
        barcode: null,
        description: null,
        categoryId: null,
        categoryName: null,
        costMethod: 'INHERIT',
        standardCost: null,
        salePrice: null,
        taxRate: 0,
        reorderPoint: null,
        unitOfMeasure: 'UNIT',
        mainImage: null,
        createdAt: '',
        updatedAt: '',
      } as Product;

      vi.mocked(apiClient.post).mockResolvedValue({ data: createdProduct });

      const result = await repository.create(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/products', createData);
      expect(result.id).toBe('new-id');
      expect(result.name).toBe('New Product');
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateData: UpdateProductData = {
        name: 'Updated Product',
        status: 'ARCHIVED',
      };

      const updatedProduct = {
        id: '1',
        ...updateData,
        sku: null,
        barcode: null,
        description: null,
        categoryId: null,
        categoryName: null,
        costMethod: 'STANDARD',
        standardCost: null,
        salePrice: null,
        taxRate: 0,
        reorderPoint: null,
        unitOfMeasure: 'UNIT',
        mainImage: null,
        createdAt: '',
        updatedAt: '',
      } as Product;

      vi.mocked(apiClient.put).mockResolvedValue({ data: updatedProduct });

      const result = await repository.update('1', updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/products/1', updateData);
      expect(result.name).toBe('Updated Product');
      expect(result.status).toBe('ARCHIVED');
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      await repository.delete('1');

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/products/1');
    });
  });

  describe('archive', () => {
    it('should archive a product', async () => {
      const archivedProduct: Product = {
        id: '1',
        name: 'Archived Product',
        status: 'ARCHIVED',
        sku: null,
        barcode: null,
        description: null,
        categoryId: null,
        categoryName: null,
        costMethod: 'STANDARD',
        standardCost: null,
        salePrice: null,
        taxRate: 0,
        reorderPoint: null,
        unitOfMeasure: 'UNIT',
        mainImage: null,
        createdAt: '',
        updatedAt: '',
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: archivedProduct });

      const result = await repository.archive('1');

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/products/1/archive');
      expect(result.status).toBe('ARCHIVED');
    });
  });

  describe('activate', () => {
    it('should activate a product', async () => {
      const activatedProduct: Product = {
        id: '1',
        name: 'Activated Product',
        status: 'ACTIVE',
        sku: null,
        barcode: null,
        description: null,
        categoryId: null,
        categoryName: null,
        costMethod: 'STANDARD',
        standardCost: null,
        salePrice: null,
        taxRate: 0,
        reorderPoint: null,
        unitOfMeasure: 'UNIT',
        mainImage: null,
        createdAt: '',
        updatedAt: '',
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: activatedProduct });

      const result = await repository.activate('1');

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/products/1/activate');
      expect(result.status).toBe('ACTIVE');
    });
  });
});