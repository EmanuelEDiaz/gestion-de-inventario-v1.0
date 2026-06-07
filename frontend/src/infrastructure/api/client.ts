import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Cliente HTTP configurado para comunicación con el backend.
 * Maneja tokens JWT automáticamente con soporte cross-tab y race condition.
 */

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Variables para cola de refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

// BroadcastChannel para propagar token entre pestañas
const tokenChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('token-refresh')
  : null;

function broadcastTokenRefreshed(token: string): void {
  tokenChannel?.postMessage({ type: 'TOKEN_REFRESHED', token });
  localStorage.setItem('auth-refresh-token', token);
}

async function waitForTokenRefresh(timeoutMs: number): Promise<void> {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const check = () => {
      const stored = localStorage.getItem('access_token');
      if (stored) {
        resolve();
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        reject(new Error('Token refresh timeout'));
        return;
      }
      setTimeout(check, 100);
    };

    const bcHandler = (e: MessageEvent) => {
      if (e.data?.type === 'TOKEN_REFRESHED') {
        resolve();
      }
    };
    tokenChannel?.addEventListener('message', bcHandler);

    const storageHandler = () => {
      if (localStorage.getItem('access_token')) resolve();
    };
    window.addEventListener('storage', storageHandler);

    check();

    Promise.resolve().finally(() => {
      tokenChannel?.removeEventListener('message', bcHandler);
      window.removeEventListener('storage', storageHandler);
    });
  });
}

interface RefreshTokensResult {
  accessToken: string;
}

async function refreshTokens(): Promise<RefreshTokensResult> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const refreshResponse = await axios.post(
    `${API_BASE_URL}/api/v1/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', newRefreshToken);
  document.cookie = `access_token=${accessToken}; path=/; SameSite=Lax`;

  broadcastTokenRefreshed(accessToken);
  return { accessToken };
}

// Crear instancia de Axios
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Interceptor de request: agregar token de acceso
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response: manejar 401 con cola + lock cross-tab
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const hasLocks = typeof navigator !== 'undefined' && 'locks' in navigator;
      let accessToken: string;

      if (hasLocks) {
        const result = await navigator.locks.request(
          'token-refresh-lock',
          { ifAvailable: true },
          async (lock): Promise<RefreshTokensResult | null> => {
            if (!lock) {
              await waitForTokenRefresh(5000);
              return { accessToken: localStorage.getItem('access_token') || '' };
            }
            return refreshTokens();
          }
        );
        accessToken = result?.accessToken ?? localStorage.getItem('access_token') ?? '';
      } else {
        const result = await refreshTokens();
        accessToken = result.accessToken;
      }

      processQueue(null, accessToken);
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Helper para manejar errores API
export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errorCode?: string;
  fieldErrors?: Array<{
    field: string;
    message: string;
  }>;
}

export function isApiError(error: unknown): error is AxiosError<ApiError> {
  return axios.isAxiosError(error) && error.response?.data?.type !== undefined;
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.response?.data.detail || error.response?.data.title || 'Error desconocido';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error desconocido';
}
