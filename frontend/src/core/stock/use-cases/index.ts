import { IStockRepository } from '../ports/IStockRepository';
import { StockBalance, StockFilter } from '../entities/stock-balance';

export class GetStockBalanceUseCase {
  constructor(private repository: IStockRepository) {}

  async execute(warehouseId: string, productId: string): Promise<StockBalance> {
    return this.repository.getBalance(warehouseId, productId);
  }
}

export class GetStockByWarehouseUseCase {
  constructor(private repository: IStockRepository) {}

  async execute(warehouseId: string, belowReorderOnly = false): Promise<StockBalance[]> {
    return this.repository.getByWarehouse(warehouseId, belowReorderOnly);
  }
}

export class GetStockByProductUseCase {
  constructor(private repository: IStockRepository) {}

  async execute(productId: string): Promise<StockBalance[]> {
    return this.repository.getByProduct(productId);
  }
}

export class GetAllStockBalancesUseCase {
  constructor(private repository: IStockRepository) {}

  async execute(filter?: StockFilter): Promise<StockBalance[]> {
    return this.repository.getAll(filter);
  }
}

export class GetLowStockAlertsUseCase {
  constructor(private repository: IStockRepository) {}

  async execute(): Promise<StockBalance[]> {
    return this.repository.getLowStockAlerts();
  }
}
