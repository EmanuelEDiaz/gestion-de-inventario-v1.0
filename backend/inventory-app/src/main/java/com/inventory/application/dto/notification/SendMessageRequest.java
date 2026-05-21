package com.inventory.application.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SendMessageRequest(
    @NotBlank String title,
    String body,
    @NotNull String targetUserId
) {}
