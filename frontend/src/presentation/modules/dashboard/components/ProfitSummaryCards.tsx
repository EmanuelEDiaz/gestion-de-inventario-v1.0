'use client';

import { TrendingUp, TrendingDown, DollarSign, Percent } from '@/presentation/shared/components/ui/icon-mapping';
import type { ProfitSummary, InventoryValue } from '@/core/dashboard/entities/recharts-types';
import { formatCurrency } from '@/presentation/shared/lib/utils';

interface ProfitSummaryCardsProps {
  profitSummary?: ProfitSummary;
  inventoryValue?: InventoryValue;
  loading?: boolean;
}

export function ProfitSummaryCards({ profitSummary, inventoryValue, loading }: ProfitSummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {profitSummary && (
        <>
          <ProfitCard
            title="Ingresos"
            value={formatCurrency(profitSummary.totalRevenue)}
            icon={<TrendingUp className="h-6 w-6 text-white" />}
            colorClass="bg-green-500"
          />
          <ProfitCard
            title="Costos"
            value={formatCurrency(profitSummary.totalCost)}
            icon={<TrendingDown className="h-6 w-6 text-white" />}
            colorClass="bg-red-500"
          />
          <ProfitCard
            title="Ganancia"
            value={formatCurrency(profitSummary.totalProfit)}
            icon={<DollarSign className="h-6 w-6 text-white" />}
            colorClass="bg-blue-500"
          />
          <ProfitCard
            title="Margen"
            value={`${(profitSummary.profitMargin * 100).toFixed(1)}%`}
            icon={<Percent className="h-6 w-6 text-white" />}
            colorClass="bg-purple-500"
          />
        </>
      )}
      {inventoryValue && (
        <>
          <ProfitCard
            title="Valor Inventario"
            value={formatCurrency(inventoryValue.totalValue)}
            icon={<DollarSign className="h-6 w-6 text-white" />}
            colorClass="bg-amber-500"
          />
          <ProfitCard
            title="Costo Promedio"
            value={formatCurrency(inventoryValue.avgCost)}
            icon={<DollarSign className="h-6 w-6 text-white" />}
            colorClass="bg-teal-500"
          />
          <ProfitCard
            title="Productos"
            value={inventoryValue.productCount}
            icon={<DollarSign className="h-6 w-6 text-white" />}
            colorClass="bg-indigo-500"
          />
          <ProfitCard
            title="Stock Bajo"
            value={inventoryValue.lowStockCount}
            icon={<DollarSign className="h-6 w-6 text-white" />}
            colorClass={inventoryValue.lowStockCount > 0 ? 'bg-yellow-500' : 'bg-gray-400'}
          />
        </>
      )}
      {!profitSummary && !inventoryValue && (
        <div className="col-span-4 rounded-lg bg-white p-8 text-center text-sm text-gray-400 shadow">
          No hay datos financieros disponibles
        </div>
      )}
    </div>
  );
}

interface ProfitCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}

function ProfitCard({ title, value, icon, colorClass }: ProfitCardProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClass}`}>
            {icon}
          </div>
          <div className="flex-1">
            <p className="truncate text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
