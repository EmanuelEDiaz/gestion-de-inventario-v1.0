package com.inventory.application.dto.sync;

public record PushResultDto(
    String operationId,
    boolean accepted,
    Object data,
    String error,
    String entityId
) {}
