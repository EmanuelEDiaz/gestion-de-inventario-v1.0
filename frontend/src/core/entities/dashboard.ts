export interface DashboardStats {
  totalProducts: number;
  totalWarehouses: number;
  totalCustomers: number;
  totalSuppliers: number;
  lowStockCount: number;
  outOfStockCount: number;
  salesToday: number;
  salesThisWeek: number;
  salesTodayCount: number;
  purchasesThisWeek: number;
}

export interface LowStockItem {
  productId: string;
  productName: string;
  productSku: string;
  warehouseId: string;
  warehouseName?: string;
  onHand: number;
  reorderPoint: number;
}
