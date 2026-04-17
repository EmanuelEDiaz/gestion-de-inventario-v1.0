'use client';

import { useAuthStore } from '@/presentation/shared/hooks/useAuthStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Título y bienvenida */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
        <p className="text-gray-600">
          Bienvenido, {user?.displayName || user?.username}
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Productos"
          value="0"
          description="Total de productos activos"
          color="blue"
        />
        <DashboardCard
          title="Almacenes"
          value="1"
          description="Almacenes registrados"
          color="green"
        />
        <DashboardCard
          title="Stock Bajo"
          value="0"
          description="Productos con stock bajo"
          color="yellow"
        />
        <DashboardCard
          title="Ventas Hoy"
          value="$0"
          description="Total de ventas del día"
          color="purple"
        />
      </div>

      {/* Secciones adicionales */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Actividad reciente */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Actividad Reciente
          </h2>
          <div className="text-center text-gray-500 py-8">
            No hay actividad reciente
          </div>
        </div>

        {/* Productos con bajo stock */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Productos con Bajo Stock
          </h2>
          <div className="text-center text-gray-500 py-8">
            Todos los productos tienen stock suficiente
          </div>
        </div>
      </div>
    </div>
  );
}

interface DashboardCardProps {
  title: string;
  value: string;
  description: string;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}

function DashboardCard({ title, value, description, color }: DashboardCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`h-12 w-12 rounded-lg ${colorClasses[color]}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="truncate text-sm font-medium text-gray-500">
                {title}
              </dt>
              <dd className="text-2xl font-semibold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm text-gray-500">{description}</div>
      </div>
    </div>
  );
}
