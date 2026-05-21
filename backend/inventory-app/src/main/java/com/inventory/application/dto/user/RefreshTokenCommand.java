package com.inventory.application.user.dto;

/**
 * Comando para el caso de uso de refresh token.
 */
public record RefreshTokenCommand(
    String refreshToken
) {
    public RefreshTokenCommand {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("refreshToken cannot be null or blank");
        }
    }
}
