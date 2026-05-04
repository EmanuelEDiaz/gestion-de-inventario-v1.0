'use client';

import { useReportsController } from '../hooks/useReportsController';
import { SalesReportCard, InventoryReportCard } from '../components/ReportCards';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';

export function ReportsView() {
  const { salesReport, inventoryReport } = useReportsController();

  const isLoading = salesReport.isLoading || inventoryReport.isLoading;
  const error = salesReport.error || inventoryReport.error;

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error instanceof Error ? error.message : 'Error cargando reportes'} />;

  return (
    <div className="space-y-6">
      {salesReport.data && <SalesReportCard report={salesReport.data} />}
      {inventoryReport.data && <InventoryReportCard report={inventoryReport.data} />}
    </div>
  );
}
