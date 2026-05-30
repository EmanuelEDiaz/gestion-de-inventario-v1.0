'use client';

import { useState } from 'react';
import { useAuthStore } from '@/presentation/shared/hooks/storage/useAuthStore';
import { useDashboard } from '@/presentation/modules/dashboard/hooks/useDashboard';
import { useDashboardMetrics } from '@/presentation/modules/dashboard/hooks/useDashboardMetrics';
import { useDashboardLayout } from '@/presentation/modules/dashboard/hooks/useDashboardLayout';
import { DashboardStatsGrid } from '@/presentation/modules/dashboard/components/DashboardStatsGrid';
import { LowStockList } from '@/presentation/modules/dashboard/components/LowStockList';
import { ProfitSummaryCards } from '@/presentation/modules/dashboard/components/ProfitSummaryCards';
import { SalesTimelineChart } from '@/presentation/modules/dashboard/components/SalesTimelineChart';
import { TopProductsChart } from '@/presentation/modules/dashboard/components/TopProductsChart';
import { TopCustomersChart } from '@/presentation/modules/dashboard/components/TopCustomersChart';
import { ChartBuilderModal } from '@/presentation/modules/dashboard/components/ChartBuilderModal';
import { CustomChartWidget } from '@/presentation/modules/dashboard/components/CustomChartWidget';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Plus } from '@/presentation/shared/components/ui/icon-mapping';
import { formatCurrency } from '@/presentation/shared/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { stats, lowStockItems, loading, errorMessage } = useDashboard();
  const { profitSummary, inventoryValue, timeline, topProducts, topCustomers, loading: metricsLoading } = useDashboardMetrics();
  const { widgets } = useDashboardLayout();
  const [showChartBuilder, setShowChartBuilder] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
        <p className="text-gray-600">
          Bienvenido, {user?.displayName || user?.username}
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
      )}

      <ProfitSummaryCards
        profitSummary={profitSummary}
        inventoryValue={inventoryValue}
        loading={metricsLoading}
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : stats ? (
        <DashboardStatsGrid stats={stats} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesTimelineChart data={timeline} />
        </div>
        <div>
          <WeeklySummaryCard stats={stats} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopProductsChart data={topProducts} />
        <TopCustomersChart data={topCustomers} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Productos con Bajo Stock
            {lowStockItems.length > 0 && (
              <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                {lowStockItems.length}
              </span>
            )}
          </h2>
          <LowStockList items={lowStockItems} />
        </div>
      </div>

      {widgets.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Widgets Personalizados</h2>
            <Button variant="outline" size="sm" onClick={() => setShowChartBuilder(true)}>
              <Plus className="mr-1 h-4 w-4" /> Agregar Gráfico
            </Button>
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {widgets.map(w => (
              <div key={w.config.id} style={{ gridColumn: `span ${w.position.w}` }}>
                <CustomChartWidget widget={w} />
              </div>
            ))}
          </div>
        </div>
      )}

      {widgets.length === 0 && (
        <div className="text-center">
          <Button variant="outline" onClick={() => setShowChartBuilder(true)}>
            <Plus className="mr-1 h-4 w-4" /> Agregar Gráfico Personalizado
          </Button>
        </div>
      )}

      <ChartBuilderModal open={showChartBuilder} onClose={() => setShowChartBuilder(false)} />
    </div>
  );
}

function WeeklySummaryCard({ stats }: { stats: { salesThisWeek: number; purchasesThisWeek: number; outOfStockCount: number } | null }) {
  if (!stats) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Resumen Semanal</h2>
        <div className="py-8 text-center text-sm text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Resumen Semanal</h2>
      <dl className="space-y-3">
        <div className="flex justify-between text-sm">
          <dt className="text-gray-500">Ventas esta semana</dt>
          <dd className="font-medium text-gray-900">{formatCurrency(stats.salesThisWeek)}</dd>
        </div>
        <div className="flex justify-between text-sm">
          <dt className="text-gray-500">Compras esta semana</dt>
          <dd className="font-medium text-gray-900">{formatCurrency(stats.purchasesThisWeek)}</dd>
        </div>
        <div className="flex justify-between text-sm">
          <dt className="text-gray-500">Sin stock</dt>
          <dd className={`font-medium ${stats.outOfStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {stats.outOfStockCount} producto{stats.outOfStockCount !== 1 ? 's' : ''}
          </dd>
        </div>
      </dl>
    </div>
  );
}
