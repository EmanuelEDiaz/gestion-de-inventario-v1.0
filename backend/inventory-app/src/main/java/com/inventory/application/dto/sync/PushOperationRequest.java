package com.inventory.application.dto.sync;

import jakarta.validation.constraints.NotBlank;

public record PushOperationRequest(
    @NotBlank String operationId,
    @NotBlank String entityType,
    @NotBlank String entityId,
    @NotBlank String action,
    Object payload
) {}
