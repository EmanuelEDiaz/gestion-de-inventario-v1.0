import { apiClient } from '@/infrastructure/api/client';

interface UserPreferences {
  maxProductPages: number;
  searchDebounceMs: number;
}

const DEFAULT_PREFS: UserPreferences = {
  maxProductPages: 20,
  searchDebounceMs: 300,
};

export const userPreferencesRepository = {
  async get(): Promise<UserPreferences> {
    try {
      const response = await apiClient.get<UserPreferences>('/api/v1/users/me/preferences');
      return { ...DEFAULT_PREFS, ...response.data };
    } catch {
      // Offline fallback: return safe defaults if server unreachable
      return DEFAULT_PREFS;
    }
  },

  async update(prefs: Partial<UserPreferences>): Promise<void> {
    await apiClient.put('/api/v1/users/me/preferences', prefs);
  },

  getMaxProductPages(): Promise<number> {
    return this.get().then((p) => p.maxProductPages);
  },
};
