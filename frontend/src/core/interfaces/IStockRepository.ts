import { StockBalance, StockFilter } from '../entities/stock-balance';

/**
 * Puerto: Repositorio de Stock
 */
export interface IStockRepository {
  getBalance(warehouseId: string, productId: string): Promise<StockBalance>;
  getByWarehouse(warehouseId: string, belowReorderOnly?: boolean): Promise<StockBalance[]>;
  getByProduct(productId: string): Promise<StockBalance[]>;
  getAll(filter?: StockFilter): Promise<StockBalance[]>;
  getLowStockAlerts(): Promise<StockBalance[]>;
}
