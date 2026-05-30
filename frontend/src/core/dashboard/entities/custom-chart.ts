export type ChartMetric = 'revenue' | 'cost' | 'profit' | 'salesCount' | 'profitMargin';

export type ChartGroupBy = 'day' | 'week' | 'month' | 'product' | 'customer' | 'category';

export type ChartType = 'bar' | 'line' | 'pie' | 'area';

export interface CustomChartConfig {
  id: string;
  title: string;
  metric: ChartMetric;
  groupBy: ChartGroupBy;
  chartType: ChartType;
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CustomChartWidget {
  config: CustomChartConfig;
  position: WidgetPosition;
}
