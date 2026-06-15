import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductRepository } from './ProductRepository';
import { apiClient } from '../../api/client';
import type { Product, CreateProductData, UpdateProductData } from '@/core/product/entities/product';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { addToOutbox } from '@/infrastructure/storage/outbox';

vi.mock('../../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  isClientError: vi.fn(),
}));

const fakeStore = new Map<string, unknown>();
const fakeDb = {
  getAll: vi.fn(async (store: string) => Array.from(fakeStore.values()).filter((v) => (v as { __store?: string }).__store === store)),
  get: vi.fn(async (store: string, id: string) => fakeStore.get(`${store}:${id}`)),
  put: vi.fn(async (store: string, value: unknown) => {
    const id = (value as { id?: string }).id ?? crypto.randomUUID();
    fakeStore.set(`${store}:${id}`, { ...(value as object), __store: store });
    return id;
  }),
  delete: vi.fn(async (store: string, id: string) => { fakeStore.delete(`${store}:${id}`); }),
  transaction: vi.fn(),
};

vi.mock('@/infrastructure/storage/db', () => ({
  getDB: vi.fn(async () => fakeDb),
  safeCacheWrite: vi.fn(async (op: () => Promise<unknown>) => op()),
}));

vi.mock('@/infrastructure/storage/networkStore', () => ({
  getNetworkMode: vi.fn(() => 'online-direct' as const),
}));

vi.mock('@/infrastructure/storage/outbox', () => ({
  addToOutbox: vi.fn(async () => undefined),
}));

describe('ProductRepository (local-first)', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeStore.clear();
    repository = new ProductRepository();
  });

  describe('reads (local-first, no HTTP)', () => {
    it('getAllPaginated reads from IDB, never HTTP', async () => {
      fakeStore.set('products:1', { __store: 'products', id: '1', name: 'Test', status: 'ACTIVE', sku: null, barcode: null, description: null, categoryId: null, categoryName: null, costMethod: 'STANDARD', standardCost: null, salePrice: null, taxRate: 0, reorderPoint: null, unitOfMeasure: 'UNIT', mainImage: null, createdAt: '', updatedAt: '' });

      const result = await repository.getAllPaginated({ search: 'test', page: 0, size: 20 });

      expect(apiClient.get).not.toHaveBeenCalled();
      expect(result.content).toHaveLength(1);
      expect(result.totalElements).toBe(1);
    });

    it('getAllPaginated filters by search term in IDB', async () => {
      fakeStore.set('products:1', { __store: 'products', id: '1', name: 'Apple', status: 'ACTIVE', sku: 'A-1', barcode: null, description: null, categoryId: null, categoryName: null, costMethod: 'STANDARD', standardCost: null, salePrice: null, taxRate: 0, reorderPoint: null, unitOfMeasure: 'UNIT', mainImage: null, createdAt: '', updatedAt: '' });
      fakeStore.set('products:2', { __store: 'products', id: '2', name: 'Banana', status: 'ACTIVE', sku: 'B-1', barcode: null, description: null, categoryId: null, categoryName: null, costMethod: 'STANDARD', standardCost: null, salePrice: null, taxRate: 0, reorderPoint: null, unitOfMeasure: 'UNIT', mainImage: null, createdAt: '', updatedAt: '' });

      const result = await repository.getAllPaginated({ search: 'app' });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.name).toBe('Apple');
    });

    it('getById reads from IDB, never HTTP', async () => {
      const product: Product = { id: '1', name: 'Test', status: 'ACTIVE', sku: null, barcode: null, description: null, categoryId: null, categoryName: null, costMethod: 'STANDARD', standardCost: null, salePrice: null, taxRate: 0, reorderPoint: null, unitOfMeasure: 'UNIT', mainImage: null, createdAt: '', updatedAt: '' };
      fakeStore.set('products:1', { __store: 'products', ...product });

      const result = await repository.getById('1');

      expect(apiClient.get).not.toHaveBeenCalled();
      expect(result.name).toBe('Test');
    });
  });

  describe('writes (HTTP-first with outbox fallback)', () => {
    it('create calls HTTP and updates cache on success', async () => {
      const createData: CreateProductData = { name: 'New', sku: 'X-1' };
      const created = { id: 'new-id', ...createData, status: 'ACTIVE' as const, barcode: null, description: null, categoryId: null, categoryName: null, costMethod: 'INHERIT' as const, standardCost: null, salePrice: null, taxRate: 0, reorderPoint: null, unitOfMeasure: 'UNIT' as const, mainImage: null, createdAt: '', updatedAt: '' };
      vi.mocked(apiClient.post).mockResolvedValue({ data: created });

      const result = await repository.create(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/products', createData);
      expect(result.id).toBe('new-id');
    });

    it('update calls HTTP and updates cache on success', async () => {
      const updateData: UpdateProductData = { name: 'Updated', status: 'ARCHIVED' };
      const updated = { id: '1', ...updateData, sku: null, barcode: null, description: null, categoryId: null, categoryName: null, costMethod: 'STANDARD' as const, standardCost: null, salePrice: null, taxRate: 0, reorderPoint: null, unitOfMeasure: 'UNIT' as const, mainImage: null, createdAt: '', updatedAt: '' };
      vi.mocked(apiClient.put).mockResolvedValue({ data: updated });

      const result = await repository.update('1', updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/products/1', updateData);
      expect(result.name).toBe('Updated');
    });

    it('delete calls HTTP and removes from cache on success', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      await repository.delete('1');

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/products/1');
    });
  });

  describe('writes (offline → outbox)', () => {
    beforeEach(() => {
      vi.mocked(getNetworkMode).mockReturnValue('offline' as never);
    });

    it('create goes to outbox when offline', async () => {
      const result = await repository.create({ name: 'Pending' });

      expect(apiClient.post).not.toHaveBeenCalled();
      expect(addToOutbox).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', entityType: 'PRODUCT' }));
      expect(result.id).toMatch(/^temp_/);
    });

    it('create goes to outbox when HTTP fails in online-degraded', async () => {
      vi.mocked(getNetworkMode).mockReturnValue('online-degraded' as never);
      vi.mocked(apiClient.post).mockRejectedValue(new Error('network'));

      await repository.create({ name: 'Pending' });

      expect(apiClient.post).toHaveBeenCalled();
      expect(addToOutbox).toHaveBeenCalled();
    });
  });
});
