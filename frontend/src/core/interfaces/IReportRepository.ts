export interface DashboardReport {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  salesCount: number;
  period: string;
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface SalesReportFilter {
  fromDate?: string;
  toDate?: string;
  warehouseId?: string;
}

export interface InventoryReportFilter {
  warehouseId?: string;
  categoryId?: string;
}

export interface IReportRepository {
  getSalesReport(filter?: SalesReportFilter): Promise<DashboardReport>;
  getInventoryReport(filter?: InventoryReportFilter): Promise<InventoryReport>;
}
