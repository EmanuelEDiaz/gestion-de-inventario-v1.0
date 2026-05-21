import { IAuthRepository } from '@/core/auth/ports/IAuthRepository';
import { AuthResponse, LoginCredentials, RefreshTokenRequest, AuthUser } from '@/core/user/entities/user';
import { apiClient } from '@/infrastructure/api/client';

/**
 * Implementación del repositorio de autenticación.
 * Adapter que conecta con el backend via HTTP.
 */
export class AuthRepository implements IAuthRepository {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', credentials);
    
    // localStorage: persistencia en cliente
    // Cookie: para que el middleware del servidor pueda leerlo (SameSite=Lax para Chrome)
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.data.accessToken);
      localStorage.setItem('refresh_token', response.data.refreshToken);
      document.cookie = `access_token=${response.data.accessToken}; path=/; SameSite=Lax`;
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = typeof window !== 'undefined' 
        ? localStorage.getItem('refresh_token')
        : null;
      
      if (refreshToken) {
        await apiClient.post('/api/v1/auth/logout', { refreshToken });
      }
    } finally {
      // Limpiar tokens locales y cookie
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    }
  }

  async refreshToken(request: RefreshTokenRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/refresh', request);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.data.accessToken);
      localStorage.setItem('refresh_token', response.data.refreshToken);
      document.cookie = `access_token=${response.data.accessToken}; path=/; SameSite=Lax`;
    }
    
    return response.data;
  }

  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>('/api/v1/auth/me');
    return response.data;
  }
}

// Singleton instance
export const authRepository = new AuthRepository();
