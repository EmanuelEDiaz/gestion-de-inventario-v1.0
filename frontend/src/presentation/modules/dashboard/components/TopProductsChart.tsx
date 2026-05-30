'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import type { TopProductEntry } from '@/core/dashboard/entities/recharts-types';
import { formatCurrency } from '@/presentation/shared/lib/utils';

interface TopProductsChartProps {
  data: TopProductEntry[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Productos</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-gray-400">
            Sin datos de productos
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(250, data.length * 40)}>
            <BarChart data={data} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="productName" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="totalRevenue" fill="#3b82f6" name="Ingresos" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
