import { IAuthRepository } from '@/core/interfaces/IAuthRepository';
import { AuthResponse, LoginCredentials, RefreshTokenRequest, AuthUser } from '@/core/entities/user';
import { apiClient } from '@/infrastructure/api/client';

/**
 * Implementación del repositorio de autenticación.
 * Adapter que conecta con el backend via HTTP.
 */
export class AuthRepository implements IAuthRepository {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    // Guardar tokens en sessionStorage para requests client-side
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('access_token', response.data.accessToken);
      sessionStorage.setItem('refresh_token', response.data.refreshToken);
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = typeof window !== 'undefined' 
        ? sessionStorage.getItem('refresh_token') 
        : null;
      
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } finally {
      // Limpiar tokens locales
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
      }
    }
  }

  async refreshToken(request: RefreshTokenRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', request);
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('access_token', response.data.accessToken);
      sessionStorage.setItem('refresh_token', response.data.refreshToken);
    }
    
    return response.data;
  }

  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>('/auth/me');
    return response.data;
  }
}

// Singleton instance
export const authRepository = new AuthRepository();
