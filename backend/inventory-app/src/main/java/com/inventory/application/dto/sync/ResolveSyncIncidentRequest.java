package com.inventory.application.sync.dto;

import jakarta.validation.constraints.NotBlank;

public record ResolveSyncIncidentRequest(
    @NotBlank String resolution
) {}
