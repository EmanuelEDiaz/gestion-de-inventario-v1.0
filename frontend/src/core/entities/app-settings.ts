export type CostMethod = 'STANDARD' | 'WAC' | 'FIFO';

export interface AppSettings {
  defaultCostMethod: CostMethod;
  defaultCurrencyCode: string;
  companyName: string | null;
  lowStockThresholdDefault: number | null;
  maxProductPages: number;
  version: number;
}

export interface UpdateSettingsInput {
  defaultCostMethod?: CostMethod;
  defaultCurrencyCode?: string;
  companyName?: string;
  lowStockThresholdDefault?: number;
  maxProductPages?: number;
}

export const COST_METHOD_LABELS: Record<CostMethod, string> = {
  STANDARD: 'Costo Estándar',
  WAC: 'Costo Promedio Ponderado',
  FIFO: 'Primero en Entrar, Primero en Salir',
};
