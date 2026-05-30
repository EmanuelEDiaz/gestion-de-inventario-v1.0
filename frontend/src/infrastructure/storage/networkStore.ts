import { create } from 'zustand';

export type NetworkMode = 'online-direct' | 'online-degraded' | 'offline';

interface NetworkStore {
  mode: NetworkMode;
  setMode: (mode: NetworkMode) => void;
}

export const useNetworkStore = create<NetworkStore>()((set) => ({
  mode: 'online-direct',
  setMode: (mode: NetworkMode) => set({ mode }),
}));

export const getNetworkMode = (): NetworkMode => useNetworkStore.getState().mode;
