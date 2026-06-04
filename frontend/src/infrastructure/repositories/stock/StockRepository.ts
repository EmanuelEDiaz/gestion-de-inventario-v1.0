import { IStockRepository } from '@/core/stock/ports/IStockRepository';
import { StockBalance, StockFilter } from '@/core/stock/entities/stock-balance';
import { getDB } from '@/infrastructure/storage/db';

type CachedStockRow = {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  cachedAt: number;
};

function applyFilter(items: CachedStockRow[], filter?: StockFilter): CachedStockRow[] {
  if (!filter) return items;
  return items.filter((b) => {
    if (filter.warehouseId && b.warehouseId !== filter.warehouseId) return false;
    if (filter.productId && b.productId !== filter.productId) return false;
    if (filter.outOfStock && b.quantity > 0) return false;
    return true;
  });
}

export class StockRepository implements IStockRepository {
  async getBalance(warehouseId: string, productId: string): Promise<StockBalance> {
    const db = await getDB();
    const all = (await db.getAll('stockBalances')) as CachedStockRow[];
    const balance = all.find((b) => b.warehouseId === warehouseId && b.productId === productId);
    if (!balance) {
      throw new Error(`Balance de stock no encontrado en caché: warehouse=${warehouseId} product=${productId}`);
    }
    return balance as unknown as StockBalance;
  }

  async getByWarehouse(warehouseId: string, belowReorderOnly = false): Promise<StockBalance[]> {
    const db = await getDB();
    const all = (await db.getAll('stockBalances')) as CachedStockRow[];
    let filtered = all.filter((b) => b.warehouseId === warehouseId);
    if (belowReorderOnly) {
      const products = (await db.getAll('products')) as Array<{ id: string; reorderPoint: number | null }>;
      const reorderByProduct = new Map(products.map((p) => [p.id, p.reorderPoint]));
      filtered = filtered.filter((b) => {
        const rp = reorderByProduct.get(b.productId);
        return rp != null && b.quantity <= rp;
      });
    }
    return filtered as unknown as StockBalance[];
  }

  async getByProduct(productId: string): Promise<StockBalance[]> {
    const db = await getDB();
    const all = (await db.getAll('stockBalances')) as CachedStockRow[];
    return all.filter((b) => b.productId === productId) as unknown as StockBalance[];
  }

  async getAll(filter?: StockFilter): Promise<StockBalance[]> {
    const db = await getDB();
    const all = (await db.getAll('stockBalances')) as CachedStockRow[];
    return applyFilter(all, filter) as unknown as StockBalance[];
  }

  async getLowStockAlerts(): Promise<StockBalance[]> {
    const db = await getDB();
    const [all, products] = await Promise.all([
      db.getAll('stockBalances') as Promise<CachedStockRow[]>,
      db.getAll('products') as Promise<Array<{ id: string; reorderPoint: number | null }>>,
    ]);
    const reorderByProduct = new Map(products.map((p) => [p.id, p.reorderPoint]));
    return all
      .filter((b) => {
        const rp = reorderByProduct.get(b.productId);
        return rp != null && b.quantity <= rp;
      })
      .map((b) => ({ ...b, quantity: b.quantity } as unknown as StockBalance));
  }
}

export const stockRepository = new StockRepository();
