package com.inventory.application.usecase;

import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada para el caso de uso de logout.
 */
public interface LogoutUseCase {
    
    /**
     * Cierra la sesión del usuario revocando el refresh token.
     * 
     * @param refreshToken Token de refresco a revocar
     * @return Mono<Void> completado cuando el logout es exitoso
     */
    Mono<Void> execute(String refreshToken);
    
    /**
     * Cierra todas las sesiones del usuario.
     * 
     * @param userId ID del usuario
     * @return Mono<Void> completado cuando todos los tokens son revocados
     */
    Mono<Void> executeAll(UUID userId);
}
