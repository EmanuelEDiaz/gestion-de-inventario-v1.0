'use client';

import type { DashboardReport, InventoryReport } from '@/core/interfaces/IReportRepository';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';

interface SalesReportCardProps {
  report: DashboardReport;
}

export function SalesReportCard({ report }: SalesReportCardProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Resumen de Ventas — {report.period}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Ingresos" value={`$${report.totalRevenue.toLocaleString()}`} />
          <Stat label="Costo" value={`$${report.totalCost.toLocaleString()}`} />
          <Stat label="Ganancia" value={`$${report.totalProfit.toLocaleString()}`} />
          <Stat label="Ventas" value={report.salesCount.toString()} />
        </div>
      </CardContent>
    </Card>
  );
}

interface InventoryReportCardProps {
  report: InventoryReport;
}

export function InventoryReportCard({ report }: InventoryReportCardProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Resumen de Inventario</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Productos" value={report.totalProducts.toString()} />
          <Stat label="Valor Total" value={`$${report.totalValue.toLocaleString()}`} />
          <Stat label="Stock Bajo" value={report.lowStockCount.toString()} />
          <Stat label="Sin Stock" value={report.outOfStockCount.toString()} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
