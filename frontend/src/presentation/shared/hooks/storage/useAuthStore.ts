import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthUser, AuthResponse, LoginCredentials } from '@/core/user/entities/user';
import { authRepository } from '@/infrastructure/repositories/auth/AuthRepository';
import { initPersistence, destroyPersistence, clearSessionData } from '@/infrastructure/storage/db';

export type LogoutMode = 'session' | 'full';

interface AuthStore {
  // State
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean; // Track hydration status
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: (mode?: LogoutMode) => Promise<void>;
  refreshTokens: () => Promise<void>;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  hydrate: () => void;
  setHasHydrated: (state: boolean) => void;
}

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  hasHydrated: false,
};

function notifySwUserContext(userId: string | null): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SET_USER_CONTEXT',
      payload: { userId },
    });
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response: AuthResponse = await authRepository.login(credentials);
          const prevUserId = get().user?.id;
          const isDifferentUser = prevUserId && prevUserId !== response.user.id;
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          if (isDifferentUser) {
            try {
              await destroyPersistence();
            } catch (err) {
              import('@/infrastructure/logging/appLogger').then(m => m.appLogger.error('Failed to cleanup previous user data', err));
            }
          }
          try {
            await initPersistence();
          } catch (err) {
            import('@/infrastructure/logging/appLogger').then(m => m.appLogger.error('Failed to init persistence', err));
          }
          notifySwUserContext(response.user.id);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
          set({ 
            ...initialState,
            hasHydrated: true,
            error: message,
          });
          throw error;
        }
      },
      
      logout: async (mode: LogoutMode = 'session') => {
        set({ isLoading: true });
        try {
          await authRepository.logout();
        } catch (error) {
          import('@/infrastructure/logging/appLogger').then(m => m.appLogger.error('Logout error', error));
        }
        try {
          if (mode === 'full') {
            await destroyPersistence();
          } else {
            await clearSessionData();
          }
        } catch (err) {
          import('@/infrastructure/logging/appLogger').then(m => m.appLogger.error('Failed to destroy persistence', err));
        }
        notifySwUserContext(null);
        set({ ...initialState, hasHydrated: true });
      },
      
      refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          set(initialState);
          return;
        }
        
        try {
          const response = await authRepository.refreshToken({ refreshToken });
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
          });
        } catch (error) {
          import('@/infrastructure/logging/appLogger').then(m => m.appLogger.error('Token refresh failed', error));
          set(initialState);
        }
      },
      
      setError: (error: string | null) => set({ error }),
      
      clearAuth: () => {
        set({ ...initialState, hasHydrated: true });
      },
      
      hydrate: () => {
        // No longer needed - zustand persist handles localStorage
      },
      
      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Called when hydration is complete
        state?.setHasHydrated(true);
        // Re-init persistence if already authenticated from previous session
        if (state?.isAuthenticated) {
          initPersistence().catch((err) =>
            import('@/infrastructure/logging/appLogger').then(m => m.appLogger.error('Failed to re-init persistence on rehydrate', err)),
          );
        }
      },
    }
  )
);

// Helper hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useHasHydrated = () => useAuthStore((state) => state.hasHydrated);
