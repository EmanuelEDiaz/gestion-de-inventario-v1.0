package com.inventory.adapters.web.dto.user;

import java.util.Set;
import java.util.UUID;

/**
 * Response DTO para autenticación exitosa.
 */
public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    long expiresIn,
    UserDto user
) {
    public AuthResponse {
        tokenType = "Bearer";
    }
    
    /**
     * Información del usuario autenticado.
     */
    public record UserDto(
        UUID id,
        String username,
        String displayName,
        String email,
        RoleDto role
    ) {}
    
    /**
     * Información del rol.
     */
    public record RoleDto(
        UUID id,
        String code,
        String name,
        Set<String> permissions
    ) {}
}
