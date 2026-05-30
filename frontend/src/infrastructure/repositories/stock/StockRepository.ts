import { apiClient } from '@/infrastructure/api/client';
import { IStockRepository } from '@/core/stock/ports/IStockRepository';
import { StockBalance, StockFilter } from '@/core/stock/entities/stock-balance';
import { readWithCache } from '@/infrastructure/storage/networkAwareUtils';
import { getCachedStockBalances } from '@/infrastructure/storage/db';

export class StockRepository implements IStockRepository {
  private basePath = '/api/v1/stock';

  async getBalance(warehouseId: string, productId: string): Promise<StockBalance> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<StockBalance>(`${this.basePath}/warehouse/${warehouseId}/product/${productId}`);
        return response.data;
      },
      async () => {
        const balances = await getCachedStockBalances();
        const balance = balances.find(b => b.warehouseId === warehouseId && b.productId === productId);
        return balance as unknown as StockBalance;
      },
    );
  }

  async getByWarehouse(warehouseId: string, belowReorderOnly = false): Promise<StockBalance[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<StockBalance[]>(`${this.basePath}/warehouse/${warehouseId}`, { params: { belowReorderOnly } });
        return response.data;
      },
      async () => {
        const balances = await getCachedStockBalances();
        return balances.filter(b => b.warehouseId === warehouseId) as unknown as StockBalance[];
      },
    );
  }

  async getByProduct(productId: string): Promise<StockBalance[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<StockBalance[]>(`${this.basePath}/product/${productId}`);
        return response.data;
      },
      async () => {
        const balances = await getCachedStockBalances();
        return balances.filter(b => b.productId === productId) as unknown as StockBalance[];
      },
    );
  }

  async getAll(filter?: StockFilter): Promise<StockBalance[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<StockBalance[]>(this.basePath, { params: filter });
        return response.data;
      },
      async () => getCachedStockBalances() as unknown as StockBalance[],
    );
  }

  async getLowStockAlerts(): Promise<StockBalance[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<StockBalance[]>(`${this.basePath}/alerts/low-stock`);
        return response.data;
      },
      async () => [] as StockBalance[],
    );
  }
}

export const stockRepository = new StockRepository();
