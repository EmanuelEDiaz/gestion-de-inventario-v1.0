package com.inventory.application.usecase;

import com.inventory.application.user.dto.AuthResult;
import com.inventory.application.user.dto.LoginCommand;
import reactor.core.publisher.Mono;

/**
 * Puerto de entrada para el caso de uso de login.
 */
public interface LoginUseCase {
    
    /**
     * Autentica un usuario con sus credenciales.
     * 
     * @param command Comando con username, password y metadatos del dispositivo
     * @return AuthResult con tokens y datos del usuario
     * @throws com.inventory.domain.errors.InvalidCredentialsException si las credenciales son inválidas
     * @throws com.inventory.domain.errors.UserDisabledException si el usuario está desactivado
     */
    Mono<AuthResult> execute(LoginCommand command);
}
