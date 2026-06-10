import { create } from 'zustand';

export interface SchedulerState {
  isMapDownloading: boolean;
  isSyncing: boolean;
  isPruning: boolean;
  userActivityAt: number;
  setMapDownloading: (v: boolean) => void;
  setSyncing: (v: boolean) => void;
  setPruning: (v: boolean) => void;
  touchActivity: () => void;
}

export const useSchedulerState = create<SchedulerState>()((set) => ({
  isMapDownloading: false,
  isSyncing: false,
  isPruning: false,
  userActivityAt: Date.now(),
  setMapDownloading: (v) => set({ isMapDownloading: v }),
  setSyncing: (v) => set({ isSyncing: v }),
  setPruning: (v) => set({ isPruning: v }),
  touchActivity: () => set({ userActivityAt: Date.now() },
  ),
}));
