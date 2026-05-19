import { IAuthRepository } from '@/core/interfaces/IAuthRepository';
import { AuthTokens, LoginCredentials } from '@/core/entities/user';
import { AuthValidationError, InvalidCredentialsError } from '@/core/errors/AuthErrors';

export class LoginUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<AuthTokens> {
    if (!credentials.username || credentials.username.trim().length === 0) {
      throw new AuthValidationError('El nombre de usuario es requerido');
    }

    if (!credentials.password || credentials.password.length < 6) {
      throw new AuthValidationError('La contraseña debe tener al menos 6 caracteres');
    }

    try {
      return await this.authRepository.login(credentials);
    } catch (e) {
      if (e instanceof InvalidCredentialsError) throw e;
      throw new InvalidCredentialsError();
    }
  }
}
