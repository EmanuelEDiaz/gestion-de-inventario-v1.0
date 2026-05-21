'use client';

import { Package, Warehouse, Users, Truck, AlertTriangle, TrendingUp } from 'lucide-react';
import type { DashboardStats } from '@/core/dashboard/entities/dashboard';
import { formatCurrency } from '@/presentation/shared/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
}

function StatCard({ title, value, description, icon, colorClass }: StatCardProps) {
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
            <p className="text-xs text-gray-400">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DashboardStatsGridProps {
  stats: DashboardStats;
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard title="Productos" value={stats.totalProducts} description="Productos activos" icon={<Package className="h-6 w-6 text-white" />} colorClass="bg-blue-500" />
      <StatCard title="Almacenes" value={stats.totalWarehouses} description="Almacenes registrados" icon={<Warehouse className="h-6 w-6 text-white" />} colorClass="bg-green-500" />
      <StatCard title="Clientes" value={stats.totalCustomers} description="Clientes registrados" icon={<Users className="h-6 w-6 text-white" />} colorClass="bg-indigo-500" />
      <StatCard title="Proveedores" value={stats.totalSuppliers} description="Proveedores activos" icon={<Truck className="h-6 w-6 text-white" />} colorClass="bg-purple-500" />
      <StatCard title="Stock Bajo" value={stats.lowStockCount} description="Productos bajo mínimo" icon={<AlertTriangle className="h-6 w-6 text-white" />} colorClass={stats.lowStockCount > 0 ? 'bg-yellow-500' : 'bg-gray-400'} />
      <StatCard title="Ventas Hoy" value={formatCurrency(stats.salesToday)} description={`${stats.salesTodayCount} transacciones`} icon={<TrendingUp className="h-6 w-6 text-white" />} colorClass="bg-emerald-500" />
    </div>
  );
}
