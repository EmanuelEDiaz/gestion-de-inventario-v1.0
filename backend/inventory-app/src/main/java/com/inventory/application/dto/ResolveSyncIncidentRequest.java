package com.inventory.application.dto;

import jakarta.validation.constraints.NotBlank;

public record ResolveSyncIncidentRequest(
    @NotBlank String resolution
) {}
