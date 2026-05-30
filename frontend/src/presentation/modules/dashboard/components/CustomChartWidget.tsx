'use client';

import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui/Button';
import { useDashboardLayout } from '@/presentation/modules/dashboard/hooks/useDashboardLayout';
import { useSalesTimeline, useTopProducts, useTopCustomers } from '@/presentation/modules/dashboard/hooks/useDashboardMetrics';
import { formatCurrency } from '@/presentation/shared/lib/utils';
import type { CustomChartWidget as Widget } from '@/core/dashboard/entities/custom-chart';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface CustomChartWidgetProps {
  widget: Widget;
}

export function CustomChartWidget({ widget }: CustomChartWidgetProps) {
  const { removeWidget } = useDashboardLayout();
  const { config } = widget;

  const granularity = config.groupBy === 'day' ? 'day' : config.groupBy === 'week' ? 'week' : 'month';
  const { data: timelineData } = useSalesTimeline(undefined, undefined, granularity);
  const { data: topProducts } = useTopProducts();
  const { data: topCustomers } = useTopCustomers();

  let chartData: { name: string; value: number }[] = [];

  if (config.groupBy === 'product' && topProducts) {
    chartData = topProducts.map(p => ({ name: p.productName, value: p.totalRevenue }));
  } else if (config.groupBy === 'customer' && topCustomers) {
    chartData = topCustomers.map(c => ({ name: c.customerName, value: c.totalRevenue }));
  } else if (timelineData) {
    chartData = timelineData.map(t => ({
      name: t.date,
      value:
        config.metric === 'cost'
          ? t.cost
          : config.metric === 'profit'
            ? t.profit
            : config.metric === 'salesCount'
              ? t.count
              : config.metric === 'profitMargin'
                ? (t.revenue > 0 ? (t.profit / t.revenue) * 100 : 0)
                : t.revenue,
    }));
  }

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
          Sin datos disponibles
        </div>
      );
    }

    switch (config.chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Area type="monotone" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm">{config.title}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeWidget(config.id)}
          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
        >
          ×
        </Button>
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  );
}
