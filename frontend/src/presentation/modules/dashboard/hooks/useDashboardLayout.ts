'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CustomChartWidget, CustomChartConfig, WidgetPosition } from '@/core/dashboard/entities/custom-chart';

const MAX_WIDGETS = 20;

interface DashboardLayoutState {
  widgets: CustomChartWidget[];
  addWidget: (config: CustomChartConfig) => void;
  removeWidget: (id: string) => void;
  updatePosition: (id: string, position: Partial<WidgetPosition>) => void;
  reorderWidgets: (widgets: CustomChartWidget[]) => void;
}

export const useDashboardLayout = create<DashboardLayoutState>()(
  persist(
    (set, get) => ({
      widgets: [],

      addWidget: (config) => {
        const widgets = get().widgets;
        if (widgets.length >= MAX_WIDGETS) return;
        const widget: CustomChartWidget = {
          config,
          position: { x: 0, y: 0, w: 2, h: 2 },
        };
        set({ widgets: [...widgets, widget] });
      },

      removeWidget: (id) => {
        set({ widgets: get().widgets.filter(w => w.config.id !== id) });
      },

      updatePosition: (id, position) => {
        set({
          widgets: get().widgets.map(w =>
            w.config.id === id
              ? { ...w, position: { ...w.position, ...position } }
              : w
          ),
        });
      },

      reorderWidgets: (widgets) => {
        set({ widgets });
      },
    }),
    {
      name: 'dashboard-layout',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
