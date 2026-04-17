import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthUser, AuthResponse, LoginCredentials } from '@/core/entities/user';
import { authRepository } from '@/infrastructure/repositories/AuthRepository';

interface AuthStore {
  // State
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response: AuthResponse = await authRepository.login(credentials);
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
          set({ 
            ...initialState,
            error: message,
          });
          throw error;
        }
      },
      
      logout: async () => {
        set({ isLoading: true });
        try {
          await authRepository.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set(initialState);
          // Also clear sessionStorage
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
          }
        }
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
          console.error('Token refresh failed:', error);
          set(initialState);
        }
      },
      
      setError: (error: string | null) => set({ error }),
      
      clearAuth: () => {
        set(initialState);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
        }
      },
      
      hydrate: () => {
        // Sync with sessionStorage on client
        if (typeof window !== 'undefined') {
          const accessToken = sessionStorage.getItem('access_token');
          const refreshToken = sessionStorage.getItem('refresh_token');
          if (accessToken && refreshToken) {
            const state = get();
            if (!state.accessToken) {
              set({ accessToken, refreshToken });
            }
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Helper hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
