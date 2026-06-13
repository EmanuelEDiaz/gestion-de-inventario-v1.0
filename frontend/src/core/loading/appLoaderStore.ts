import { create } from 'zustand';

export type LoadPhase =
  | 'idle'
  | 'quota'
  | 'sw_precache'
  | 'db_open'
  | 'rehydrate_local'
  | 'warehouses'
  | 'categories'
  | 'products'
  | 'currencies'
  | 'exchange_rates'
  | 'customer_debts'
  | 'stock'
  | 'customers'
  | 'suppliers'
  | 'error';

export type AppAvailability =
  | 'blocking'
  | 'ready_partial'
  | 'ready_complete'
  | 'degraded'
  | 'error';

export interface FailedPhase {
  entityType: string;
  phaseLabel: string;
  error: string;
}

export interface AppLoaderState {
  phase: LoadPhase;
  availability: AppAvailability;
  progress: number;
  step: string;
  subStep: string;
  subProgress: number;
  subTotal: number;
  error: string | null;
  swCompleted: number;
  swTotal: number;
  showSwUpdateBanner: boolean;
  lastFailedPhase: FailedPhase | null;
}

export interface AppLoaderActions {
  setPhase: (phase: LoadPhase) => void;
  setAvailability: (availability: AppAvailability) => void;
  setProgress: (progress: number) => void;
  setStep: (step: string) => void;
  setSubStep: (subStep: string) => void;
  setSubProgress: (current: number, total: number) => void;
  setSWProgress: (completed: number, total: number) => void;
  setShowSwUpdateBanner: (show: boolean) => void;
  setError: (error: string) => void;
  setLastFailedPhase: (phase: FailedPhase | null) => void;
  reset: () => void;
  start: () => void;
}

const PHASE_WEIGHTS: Record<LoadPhase, number> = {
  idle: 0,
  quota: 2,
  sw_precache: 10,
  db_open: 15,
  rehydrate_local: 18,
  warehouses: 25,
  categories: 43,
  products: 40,
  currencies: 46,
  exchange_rates: 48,
  customer_debts: 50,
  stock: 52,
  customers: 58,
  suppliers: 62,
  error: 0,
};

const PHASE_LABELS: Record<LoadPhase, string> = {
  idle: 'Inicializando',
  quota: 'Verificando almacenamiento',
  sw_precache: 'Instalando aplicación',
  db_open: 'Preparando almacenamiento local',
  rehydrate_local: 'Cargando datos locales',
  warehouses: 'Descargando bodegas',
  categories: 'Descargando categorías',
  products: 'Descargando productos',
  currencies: 'Descargando monedas',
  exchange_rates: 'Descargando tasas de cambio',
  customer_debts: 'Descargando deudas',
  stock: 'Descargando existencias',
  customers: 'Descargando clientes',
  suppliers: 'Descargando proveedores',
  error: 'Error',
};

const AVAILABILITY_LABELS: Record<AppAvailability, string> = {
  blocking: 'Preparando aplicación',
  ready_partial: 'App lista',
  ready_complete: 'Todo listo',
  degraded: 'App lista (con algunas limitaciones)',
  error: 'Error al cargar',
};

export function getPhaseLabel(phase: LoadPhase): string {
  return PHASE_LABELS[phase];
}

export function getPhaseProgress(phase: LoadPhase): number {
  return PHASE_WEIGHTS[phase];
}

export function getAvailabilityLabel(availability: AppAvailability): string {
  return AVAILABILITY_LABELS[availability];
}

export interface ErrorMessageParts {
  whatHappened: string;
  impact: string;
  userAction: string;
  autoRetry: string;
}

export function formatPhaseError(
  entityType: string,
  phaseLabel: string,
  hasCore: boolean,
  isCore: boolean,
): ErrorMessageParts {
  if (hasCore) {
    return {
      whatHappened: `No se pudo descargar la actualización de ${phaseLabel}.`,
      impact: 'La app seguirá usando los datos guardados anteriormente.',
      userAction: 'Puedes reintentar la descarga, reparar datos corruptos, u omitir y continuar.',
      autoRetry: 'No hay reintento automático.',
    };
  }
  if (!isCore) {
    return {
      whatHappened: `No se pudo descargar ${phaseLabel}.`,
      impact: 'Este recurso es secundario — puedes continuar con el resto de la app.',
      userAction: 'Reintenta la descarga o continúa sin este recurso.',
      autoRetry: 'No hay reintento automático durante el boot.',
    };
  }
  return {
    whatHappened: `No se pudo descargar ${phaseLabel}.`,
    impact: 'Este es un dato esencial — la aplicación no puede iniciarse sin él.',
    userAction: 'Revisa la conexión al servidor y reintenta. Si el problema persiste, contacta al administrador.',
    autoRetry: 'No hay reintento automático.',
  };
}

const initialState: AppLoaderState = {
  phase: 'idle',
  availability: 'blocking',
  progress: 0,
  step: '',
  subStep: '',
  subProgress: 0,
  subTotal: 0,
  error: null,
  swCompleted: 0,
  swTotal: 0,
  showSwUpdateBanner: false,
  lastFailedPhase: null,
};

export const useAppLoaderStore = create<AppLoaderState & AppLoaderActions>()((set) => ({
  ...initialState,

  setPhase: (phase) =>
    set({
      phase,
      step: PHASE_LABELS[phase],
      progress: PHASE_WEIGHTS[phase],
      subStep: '',
      subProgress: 0,
      subTotal: 0,
    }),

  setAvailability: (availability) => set({ availability }),

  setProgress: (progress) => set({ progress }),

  setStep: (step) => set({ step }),

  setSubStep: (subStep) => set({ subStep }),

  setSubProgress: (current, total) => set({ subProgress: current, subTotal: total }),

  setSWProgress: (completed, total) => set({ swCompleted: completed, swTotal: total }),

  setShowSwUpdateBanner: (show) => set({ showSwUpdateBanner: show }),

  setError: (error) => set({ phase: 'error', availability: 'error', error, step: error }),

  setLastFailedPhase: (phase) => set({ lastFailedPhase: phase }),

  reset: () => set({ ...initialState, lastFailedPhase: null }),

  start: () =>
    set({
      phase: 'quota',
      availability: 'blocking',
      progress: 0,
      step: PHASE_LABELS.quota,
      subStep: '',
      subProgress: 0,
      subTotal: 0,
      error: null,
      lastFailedPhase: null,
      swCompleted: 0,
      swTotal: 0,
      showSwUpdateBanner: false,
    }),
}));
