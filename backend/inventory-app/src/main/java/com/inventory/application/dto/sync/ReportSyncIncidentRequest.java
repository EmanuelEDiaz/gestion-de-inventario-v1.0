package com.inventory.application.sync.dto;

import jakarta.validation.constraints.NotBlank;

public record ReportSyncIncidentRequest(
    @NotBlank String deviceId,
    @NotBlank String operationId,
    @NotBlank String entityType,
    @NotBlank String entityId,
    @NotBlank String incidentType,
    String myPayload,
    String serverPayload
) {}
