package com.inventory.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateNotificationRequest(
    @NotBlank String title,
    String body,
    @NotNull String category,
    @NotNull String targetType,
    String targetUserId
) {}
