import { create } from 'zustand';
import { useAppLoaderStore } from './appLoaderStore';

export type BackgroundTaskId =
  | 'image_prefetch'
  | 'precache_routes'
  | 'map_verify'
  | 'catalog_refresh';

export type BackgroundTaskStatus = 'idle' | 'running' | 'done' | 'failed' | 'skipped';

export interface BackgroundTaskProgress {
  id: BackgroundTaskId;
  label: string;
  completed: number;
  total: number;
  status: BackgroundTaskStatus;
  error?: string;
  startedAt?: number;
  finishedAt?: number;
}

export type TaskRunner = () => Promise<void>;

export interface BackgroundTasksState {
  tasks: Record<BackgroundTaskId, BackgroundTaskProgress>;
  startTask: (id: BackgroundTaskId, label: string, total: number) => void;
  updateTask: (id: BackgroundTaskId, completed: number) => void;
  completeTask: (id: BackgroundTaskId) => void;
  failTask: (id: BackgroundTaskId, error: string) => void;
  skipTask: (id: BackgroundTaskId, reason: string) => void;
  resetTask: (id: BackgroundTaskId) => void;
  startAll: (runners: Array<TaskRunner | { id: BackgroundTaskId; run: TaskRunner }>) => Promise<void>;
  allTerminated: () => boolean;
  anyRunning: () => boolean;
}

const INITIAL_TASKS: Record<BackgroundTaskId, BackgroundTaskProgress> = {
  image_prefetch: { id: 'image_prefetch', label: '', completed: 0, total: 0, status: 'idle' },
  precache_routes: { id: 'precache_routes', label: '', completed: 0, total: 0, status: 'idle' },
  map_verify: { id: 'map_verify', label: '', completed: 0, total: 0, status: 'idle' },
  catalog_refresh: { id: 'catalog_refresh', label: '', completed: 0, total: 0, status: 'idle' },
};

const TERMINAL_STATUSES: ReadonlySet<BackgroundTaskStatus> = new Set(['done', 'failed', 'skipped']);

export const useBackgroundTasksStore = create<BackgroundTasksState>()((set, get) => ({
  tasks: { ...INITIAL_TASKS },

  startTask: (id, label, total) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: {
          ...state.tasks[id],
          label,
          total,
          completed: 0,
          status: 'running',
          error: undefined,
          startedAt: Date.now(),
          finishedAt: undefined,
        },
      },
    })),

  updateTask: (id, completed) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: { ...state.tasks[id], completed },
      },
    })),

  completeTask: (id) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: {
          ...state.tasks[id],
          status: 'done',
          completed: state.tasks[id].total,
          finishedAt: Date.now(),
        },
      },
    })),

  failTask: (id, error) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: {
          ...state.tasks[id],
          status: 'failed',
          error,
          finishedAt: Date.now(),
        },
      },
    })),

  skipTask: (id, reason) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: {
          ...state.tasks[id],
          status: 'skipped',
          error: reason,
          finishedAt: Date.now(),
        },
      },
    })),

  resetTask: (id) =>
    set((state) => ({
      tasks: { ...state.tasks, [id]: { ...INITIAL_TASKS[id] } },
    })),

  startAll: async (runners) => {
    await Promise.allSettled(
      runners.map(async (entry) => {
        const run = typeof entry === 'function' ? entry : entry.run;
        const id = typeof entry === 'function' ? undefined : entry.id;
        if (id && get().tasks[id].status === 'running') return;
        try {
          await run();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (id) get().failTask(id, message);
        }
      }),
    );
  },

  allTerminated: () => {
    const { tasks } = get();
    return Object.values(tasks).every((t) => TERMINAL_STATUSES.has(t.status));
  },

  anyRunning: () => {
    const { tasks } = get();
    return Object.values(tasks).some((t) => t.status === 'running');
  },
}));

export function useReadyComplete(): boolean {
  const availability = useAppLoaderStore((s) => s.availability);
  const tasks = useBackgroundTasksStore((s) => s.tasks);
  if (availability !== 'ready_partial') return false;
  const allTerminated = Object.values(tasks).every((t) => TERMINAL_STATUSES.has(t.status));
  const anyRunning = Object.values(tasks).some((t) => t.status === 'running');
  return allTerminated && !anyRunning;
}
