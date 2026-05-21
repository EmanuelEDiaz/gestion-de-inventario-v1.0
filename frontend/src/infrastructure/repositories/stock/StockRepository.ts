import { apiClient } from '@/infrastructure/api/client';
import { IStockRepository } from '@/core/stock/ports/IStockRepository';
import { StockBalance, StockFilter } from '@/core/stock/entities/stock-balance';

export class StockRepository implements IStockRepository {
  private basePath = '/api/v1/stock';

  async getBalance(warehouseId: string, productId: string): Promise<StockBalance> {
    const response = await apiClient.get<StockBalance>(
      `${this.basePath}/warehouse/${warehouseId}/product/${productId}`
    );
    return response.data;
  }

  async getByWarehouse(warehouseId: string, belowReorderOnly = false): Promise<StockBalance[]> {
    const response = await apiClient.get<StockBalance[]>(
      `${this.basePath}/warehouse/${warehouseId}`,
      { params: { belowReorderOnly } }
    );
    return response.data;
  }

  async getByProduct(productId: string): Promise<StockBalance[]> {
    const response = await apiClient.get<StockBalance[]>(
      `${this.basePath}/product/${productId}`
    );
    return response.data;
  }

  async getAll(filter?: StockFilter): Promise<StockBalance[]> {
    const response = await apiClient.get<StockBalance[]>(this.basePath, {
      params: filter
    });
    return response.data;
  }

  async getLowStockAlerts(): Promise<StockBalance[]> {
    const response = await apiClient.get<StockBalance[]>(
      `${this.basePath}/alerts/low-stock`
    );
    return response.data;
  }
}

export const stockRepository = new StockRepository();
