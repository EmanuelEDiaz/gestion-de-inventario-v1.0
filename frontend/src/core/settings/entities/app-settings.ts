export type CostMethod = 'STANDARD' | 'WAC' | 'FIFO';

/** Configuración del sistema persistida en base de datos (singleton 'global'). */
export interface AppSettings {
  defaultCostMethod: CostMethod;
  defaultCurrencyCode: string;
  companyName: string | null;
  lowStockThresholdDefault: number | null;
  updatedBy: string | null;
  updatedAt: string | null;
  version: number;
}

/** Input para actualizar campos del sistema (PATCH). Todos opcionales. */
export interface UpdateSettingsInput {
  defaultCostMethod?: CostMethod;
  defaultCurrencyCode?: string;
  companyName?: string | null;
  lowStockThresholdDefault?: number | null;
}

/** Preferencias de interfaz de usuario — solo se guardan en localStorage. */
export interface UiPreferences {
  maxProductPages: number;
  searchDebounceMs: number;
}

export const DEFAULT_UI_PREFS: UiPreferences = {
  maxProductPages: 20,
  searchDebounceMs: 300,
};

export const COST_METHOD_LABELS: Record<CostMethod, string> = {
  STANDARD: 'Costo Estándar',
  WAC: 'Costo Promedio Ponderado',
  FIFO: 'Primero en Entrar, Primero en Salir',
};
