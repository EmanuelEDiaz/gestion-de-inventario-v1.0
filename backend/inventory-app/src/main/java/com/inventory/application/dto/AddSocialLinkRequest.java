package com.inventory.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AddSocialLinkRequest(
    @NotNull String platform,
    @NotBlank String url,
    String label,
    int sortOrder
) {}
