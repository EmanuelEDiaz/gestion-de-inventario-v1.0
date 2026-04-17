package com.inventory.adapters.web.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO para refresh token.
 */
public record RefreshTokenRequest(
    @NotBlank(message = "Refresh token is required")
    String refreshToken
) {}
