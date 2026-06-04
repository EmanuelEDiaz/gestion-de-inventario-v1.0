import type { IDashboardRepository } from '@/core/dashboard/ports/IDashboardRepository';
import type { DashboardStats, LowStockItem } from '@/core/dashboard/entities/dashboard';
import { getDB } from '@/infrastructure/storage/db';

export class DashboardRepository implements IDashboardRepository {
  async getStats(): Promise<DashboardStats> {
    const db = await getDB();
    const [products, warehouses, customers, suppliers, stockBalances] = await Promise.all([
      db.getAll('products'),
      db.getAll('warehouses'),
      db.getAll('customers'),
      db.getAll('suppliers'),
      db.getAll('stockBalances'),
    ]);

    let lowStockCount = 0;
    let outOfStockCount = 0;
    for (const balance of stockBalances) {
      if (balance.quantity <= 0) outOfStockCount++;
      else {
        const product = products.find(p => p.id === balance.productId) as { reorderPoint?: number | null } | undefined;
        if (product?.reorderPoint != null && balance.quantity <= product.reorderPoint) lowStockCount++;
      }
    }

    return {
      totalProducts: products.length,
      totalWarehouses: warehouses.length,
      totalCustomers: customers.length,
      totalSuppliers: suppliers.length,
      lowStockCount,
      outOfStockCount,
      salesToday: 0,
      salesThisWeek: 0,
      salesTodayCount: 0,
      purchasesThisWeek: 0,
    };
  }

  async getLowStockItems(): Promise<LowStockItem[]> {
    const db = await getDB();
    const [products, warehouses, stockBalances] = await Promise.all([
      db.getAll('products'),
      db.getAll('warehouses'),
      db.getAll('stockBalances'),
    ]);

    const warehouseNameMap = new Map(warehouses.map(w => [w.id, w.name]));
    const results: LowStockItem[] = [];

    for (const balance of stockBalances) {
      const product = products.find(p => p.id === balance.productId) as {
        id: string;
        name: string;
        sku: string | null;
        reorderPoint?: number | null;
      } | undefined;

      if (!product) continue;
      if (product.reorderPoint == null) continue;
      if (balance.quantity > product.reorderPoint) continue;

      results.push({
        productId: balance.productId,
        productName: product.name,
        productSku: product.sku ?? '',
        warehouseId: balance.warehouseId,
        warehouseName: warehouseNameMap.get(balance.warehouseId),
        onHand: balance.quantity,
        reorderPoint: product.reorderPoint,
      });
    }

    return results;
  }
}
