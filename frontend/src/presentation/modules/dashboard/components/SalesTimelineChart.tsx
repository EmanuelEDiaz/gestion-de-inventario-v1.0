'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import type { SalesTimelinePoint } from '@/core/dashboard/entities/recharts-types';
import { formatCurrency } from '@/presentation/shared/lib/utils';

interface SalesTimelineChartProps {
  data: SalesTimelinePoint[];
  period?: 'day' | 'week' | 'month';
}

export function SalesTimelineChart({ data, period = 'month' }: SalesTimelineChartProps) {
  const periodLabel = period === 'day' ? 'Día' : period === 'week' ? 'Semana' : 'Mes';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas por {periodLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-gray-400">
            Sin datos para el período seleccionado
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="revenue" fill="#22c55e" name="Ingresos" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" fill="#ef4444" name="Costos" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
