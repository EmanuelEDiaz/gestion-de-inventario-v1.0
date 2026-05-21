package com.inventory.application.user.dto;

/**
 * Comando para el caso de uso de login.
 */
public record LoginCommand(
    String username,
    String password
) {
    public LoginCommand {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("username cannot be null or blank");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("password cannot be null or blank");
        }
    }
}
