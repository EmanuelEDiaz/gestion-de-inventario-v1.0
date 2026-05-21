package com.inventory.domain.ports.out;

import com.inventory.domain.model.user.RefreshToken;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida para persistencia de refresh tokens.
 * Define el contrato que debe implementar el adapter de persistencia.
 */
public interface RefreshTokenRepositoryPort {
    
    /**
     * Busca un refresh token por su hash.
     */
    Mono<RefreshToken> findByTokenHash(String tokenHash);
    
    /**
     * Guarda un nuevo refresh token.
     */
    Mono<RefreshToken> save(RefreshToken token);
    
    /**
     * Revoca un refresh token por su ID.
     */
    Mono<Void> revoke(UUID tokenId);
    
    /**
     * Revoca todos los refresh tokens de un usuario.
     */
    Mono<Void> revokeAllByUserId(UUID userId);
    
    /**
     * Elimina tokens expirados (limpieza periódica).
     */
    Mono<Long> deleteExpired();
}
