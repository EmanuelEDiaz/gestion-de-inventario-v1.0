export interface SalesTimelinePoint {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  count: number;
}

export interface TopProductEntry {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
  quantitySold: number;
}

export interface TopCustomerEntry {
  customerId: string;
  customerName: string;
  totalPurchases: number;
  totalRevenue: number;
  debtBalance: number;
}

export interface ProfitSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  salesCount: number;
  avgSaleValue: number;
}

export interface InventoryValue {
  totalValue: number;
  totalCost: number;
  productCount: number;
  avgCost: number;
  lowStockCount: number;
}
