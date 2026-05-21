package com.inventory.application.user.dto;

import java.util.Set;
import java.util.UUID;

/**
 * Resultado del caso de uso de login/refresh.
 * Contiene los tokens y la información del usuario autenticado.
 */
public record AuthResult(
    String accessToken,
    String refreshToken,
    long expiresIn,
    UserInfo user
) {
    /**
     * Información del usuario autenticado.
     */
    public record UserInfo(
        UUID id,
        String username,
        String displayName,
        String email,
        RoleInfo role
    ) {}
    
    /**
     * Información del rol del usuario.
     */
    public record RoleInfo(
        UUID id,
        String code,
        String name,
        Set<String> permissions
    ) {}
}
