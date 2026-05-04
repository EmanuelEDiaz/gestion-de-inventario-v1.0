'use client';

import { useState } from 'react';
import { useExportController } from '../hooks/useExportController';
import type { ExportFormat } from '@/core/interfaces/IExportRepository';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Download } from 'lucide-react';

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

export function ExportView() {
  const { exportSalesMutation, exportInventoryMutation } = useExportController();
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filter = { format, fromDate: fromDate || undefined, toDate: toDate || undefined };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Opciones de Exportación</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Formato</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)} className="w-full rounded-md border px-3 py-2 text-sm" title="Formato de exportación">
                {FORMATS.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="fromDate" className="text-sm font-medium">Desde</label>
              <Input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} title="Fecha inicio" />
            </div>
            <div className="space-y-1">
              <label htmlFor="toDate" className="text-sm font-medium">Hasta</label>
              <Input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} title="Fecha fin" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => exportSalesMutation.mutate(filter)}
              disabled={exportSalesMutation.isPending}
              title="Exportar reporte de ventas"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportSalesMutation.isPending ? 'Exportando...' : 'Exportar Ventas'}
            </Button>
            <Button
              variant="outline"
              onClick={() => exportInventoryMutation.mutate(filter)}
              disabled={exportInventoryMutation.isPending}
              title="Exportar reporte de inventario"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportInventoryMutation.isPending ? 'Exportando...' : 'Exportar Inventario'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
