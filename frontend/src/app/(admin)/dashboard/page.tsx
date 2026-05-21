'use client';

import { useAuthStore } from '@/presentation/shared/hooks/storage/useAuthStore';
import { useDashboard } from '@/presentation/modules/dashboard/hooks/useDashboard';
import { DashboardStatsGrid } from '@/presentation/modules/dashboard/components/DashboardStatsGrid';
import { LowStockList } from '@/presentation/modules/dashboard/components/LowStockList';
import { formatCurrency } from '@/presentation/shared/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { stats, lowStockItems, loading, error } = useDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
        <p className="text-gray-600">
          Bienvenido, {user?.displayName || user?.username}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : stats ? (
        <DashboardStatsGrid stats={stats} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Resumen Semanal</h2>
          {stats ? (
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
          ) : (
            <div className="py-8 text-center text-gray-400 text-sm">Cargando...</div>
          )}
        </div>

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
    </div>
  );
}
