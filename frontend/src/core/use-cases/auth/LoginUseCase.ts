import { IAuthRepository } from '@/core/interfaces/IAuthRepository';
import { AuthTokens, LoginCredentials } from '@/core/entities/user';

/**
 * Caso de uso: Iniciar sesión.
 * Responsabilidad única: autenticar usuario y obtener tokens.
 */
export class LoginUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<AuthTokens> {
    // Validaciones de dominio
    if (!credentials.username || credentials.username.trim().length === 0) {
      throw new Error('El nombre de usuario es requerido');
    }
    
    if (!credentials.password || credentials.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // Delegar a repositorio
    return this.authRepository.login(credentials);
  }
}
