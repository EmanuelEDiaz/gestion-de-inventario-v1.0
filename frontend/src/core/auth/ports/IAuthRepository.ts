import { AuthResponse, LoginCredentials, RefreshTokenRequest, AuthUser } from '@/core/user/entities/user';

/**
 * Puerto de autenticación (contrato).
 * Define las operaciones de autenticación sin conocer la implementación.
 */
export interface IAuthRepository {
  /**
   * Iniciar sesión con credenciales.
   */
  login(credentials: LoginCredentials): Promise<AuthResponse>;

  /**
   * Cerrar sesión (revocar refresh token).
   */
  logout(): Promise<void>;

  /**
   * Refrescar token de acceso.
   */
  refreshToken(request: RefreshTokenRequest): Promise<AuthResponse>;

  /**
   * Obtener usuario actual autenticado.
   */
  getCurrentUser(): Promise<AuthUser>;
}
