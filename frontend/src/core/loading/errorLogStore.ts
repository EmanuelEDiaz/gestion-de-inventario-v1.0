import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LoadErrorEntry {
  id: string;
  timestamp: number;
  phase: string;
  message: string;
  details?: string;
}

export interface ErrorLogState {
  errors: LoadErrorEntry[];
  addError: (phase: string, message: string, details?: string) => void;
  clearErrors: () => void;
  removeError: (id: string) => void;
}

export const useErrorLogStore = create<ErrorLogState>()(
  persist(
    (set) => ({
      errors: [],

      addError: (phase, message, details) =>
        set((state) => ({
          errors: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              timestamp: Date.now(),
              phase,
              message,
              details,
            },
            ...state.errors,
          ].slice(0, 50),
        })),

      clearErrors: () => set({ errors: [] }),

      removeError: (id) =>
        set((state) => ({
          errors: state.errors.filter((e) => e.id !== id),
        })),
    }),
    { name: 'inventario-load-errors' },
  ),
);
