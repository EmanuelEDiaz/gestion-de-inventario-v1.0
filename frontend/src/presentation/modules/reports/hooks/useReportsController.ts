'use client';

import { useQuery } from '@tanstack/react-query';
import { reportRepository } from '@/infrastructure/repositories/report/ReportRepository';
import type { SalesReportFilter, InventoryReportFilter } from '@/core/report/ports/IReportRepository';

export function useReportsController(salesFilter?: SalesReportFilter, inventoryFilter?: InventoryReportFilter) {
  const salesReport = useQuery({
    queryKey: ['reports', 'sales', salesFilter],
    queryFn: () => reportRepository.getSalesReport(salesFilter),
  });

  const inventoryReport = useQuery({
    queryKey: ['reports', 'inventory', inventoryFilter],
    queryFn: () => reportRepository.getInventoryReport(inventoryFilter),
  });

  return { salesReport, inventoryReport };
}
