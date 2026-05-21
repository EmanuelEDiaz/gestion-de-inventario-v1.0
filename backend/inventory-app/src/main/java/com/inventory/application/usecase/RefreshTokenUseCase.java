package com.inventory.application.usecase;

import com.inventory.application.user.dto.AuthResult;
import com.inventory.application.user.dto.RefreshTokenCommand;
import reactor.core.publisher.Mono;

/**
 * Puerto de entrada para el caso de uso de refresh token.
 */
public interface RefreshTokenUseCase {
    
    /**
     * Renueva los tokens usando un refresh token válido.
     * 
     * @param command Comando con el refresh token y metadatos del dispositivo
     * @return AuthResult con nuevos tokens
     * @throws com.inventory.domain.errors.InvalidTokenException si el token es inválido o expirado
     */
    Mono<AuthResult> execute(RefreshTokenCommand command);
}
