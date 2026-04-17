import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Cliente HTTP configurado para comunicación con el backend.
 * Maneja tokens JWT automáticamente.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Crear instancia de Axios
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Para cookies httpOnly
});

// Interceptor de request: agregar token de acceso
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // El token viene de cookies httpOnly, manejado por el servidor
    // Para requests client-side, puede venir de memoria
    const accessToken = typeof window !== 'undefined' 
      ? sessionStorage.getItem('access_token') 
      : null;
    
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response: manejar errores y refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Si es 401 y no es el endpoint de refresh, intentar refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      try {
        // Obtener refresh token almacenado
        const refreshToken = typeof window !== 'undefined' 
          ? sessionStorage.getItem('refresh_token') 
          : null;
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Intentar refresh del token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        // Guardar nuevos tokens
        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('access_token', accessToken);
          sessionStorage.setItem('refresh_token', newRefreshToken);
        }
        
        // Reintentar request original
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh falló, redirigir a login
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
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
