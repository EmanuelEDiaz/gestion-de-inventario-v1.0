'use client';

import { useState } from 'react';
import { Dialog } from '@/presentation/shared/components/ui/Dialog';
import { Button } from '@/presentation/shared/components/ui/Button';
import { useDashboardLayout } from '@/presentation/modules/dashboard/hooks/useDashboardLayout';
import type { ChartMetric, ChartGroupBy, ChartType } from '@/core/dashboard/entities/custom-chart';

interface ChartBuilderModalProps {
  open: boolean;
  onClose: () => void;
}

const metrics: { value: ChartMetric; label: string }[] = [
  { value: 'revenue', label: 'Ingresos' },
  { value: 'cost', label: 'Costos' },
  { value: 'profit', label: 'Ganancia' },
  { value: 'salesCount', label: 'Cantidad de Ventas' },
  { value: 'profitMargin', label: 'Margen de Ganancia' },
];

const groupByOptions: { value: ChartGroupBy; label: string }[] = [
  { value: 'day', label: 'Por Día' },
  { value: 'week', label: 'Por Semana' },
  { value: 'month', label: 'Por Mes' },
  { value: 'product', label: 'Por Producto' },
  { value: 'customer', label: 'Por Cliente' },
  { value: 'category', label: 'Por Categoría' },
];

const chartTypes: { value: ChartType; label: string; icon: string }[] = [
  { value: 'bar', label: 'Barras', icon: '📊' },
  { value: 'line', label: 'Líneas', icon: '📈' },
  { value: 'pie', label: 'Pastel', icon: '🥧' },
  { value: 'area', label: 'Área', icon: '📉' },
];

export function ChartBuilderModal({ open, onClose }: ChartBuilderModalProps) {
  const [step, setStep] = useState(0);
  const [metric, setMetric] = useState<ChartMetric>('revenue');
  const [groupBy, setGroupBy] = useState<ChartGroupBy>('month');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [title, setTitle] = useState('');
  const { addWidget } = useDashboardLayout();

  const reset = () => {
    setStep(0);
    setMetric('revenue');
    setGroupBy('month');
    setChartType('bar');
    setTitle('');
  };

  const handleSave = () => {
    addWidget({
      id: crypto.randomUUID(),
      title: title || `${metrics.find(m => m.value === metric)?.label} - ${groupByOptions.find(g => g.value === groupBy)?.label}`,
      metric,
      groupBy,
      chartType,
    });
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Agregar Gráfico Personalizado"
      description={
        step === 0
          ? 'Selecciona la métrica y agrupación'
          : step === 1
            ? 'Elige el tipo de gráfico'
            : 'Revisa y guarda el widget'
      }
      size="md"
    >
      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Métrica</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as ChartMetric)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {metrics.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Agrupar por</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as ChartGroupBy)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {groupByOptions.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div className="pt-2 text-right">
            <Button onClick={() => setStep(1)}>Siguiente</Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {chartTypes.map(ct => (
              <button
                key={ct.value}
                type="button"
                onClick={() => setChartType(ct.value)}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                  chartType === ct.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{ct.icon}</span>
                <span className="text-sm font-medium">{ct.label}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(0)}>Atrás</Button>
            <Button onClick={() => setStep(2)}>Siguiente</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título del gráfico</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${metrics.find(m => m.value === metric)?.label} - ${groupByOptions.find(g => g.value === groupBy)?.label}`}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="rounded-lg bg-gray-50 p-4 space-y-1">
            <p className="text-sm text-gray-600">
              <strong>Métrica:</strong> {metrics.find(m => m.value === metric)?.label}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Agrupación:</strong> {groupByOptions.find(g => g.value === groupBy)?.label}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Tipo:</strong> {chartTypes.find(ct => ct.value === chartType)?.label}
            </p>
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
            <Button onClick={handleSave}>Guardar Widget</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
