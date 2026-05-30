package com.inventory.application.dto.sync;

import jakarta.validation.constraints.NotBlank;

public record ResolveSyncIncidentRequest(
    @NotBlank String resolution
) {}
