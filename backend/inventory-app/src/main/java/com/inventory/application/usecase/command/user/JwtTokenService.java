package com.inventory.application.usecase.command.user;

import com.inventory.domain.model.user.User;

/**
 * Servicio para generación y validación de tokens JWT.
 * Esta interfaz permite desacoplar el caso de uso de la implementación específica de JWT.
 */
public interface JwtTokenService {
    
    /**
     * Genera un access token JWT para el usuario.
     */
    String generateAccessToken(User user);
    
    /**
     * Valida un access token y extrae el username.
     * 
     * @param token El token JWT a validar
     * @return El username extraído del token
     * @throws com.inventory.domain.errors.InvalidTokenException si el token es inválido
     */
    String validateAndExtractUsername(String token);
    
    /**
     * Genera un hash SHA-256 del refresh token para almacenamiento seguro.
     */
    String hashRefreshToken(String rawToken);
    
    /**
     * Obtiene la validez del access token en segundos.
     */
    long getAccessTokenValiditySeconds();
}
