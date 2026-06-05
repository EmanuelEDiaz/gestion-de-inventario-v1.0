package com.inventory.application.dto.sync;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

public record PushResultDto(
    String operationId,
    boolean accepted,
    Object data,
    String error,
    String entityType,
    String entityId,
    String errorCode,
    String errorMessage,
    @JsonInclude(Include.NON_NULL) Object serverPayload,
    @JsonInclude(Include.NON_NULL) Object clientPayload,
    @JsonInclude(Include.NON_NULL) Integer serverVersion,
    @JsonInclude(Include.NON_NULL) Integer clientVersion
) {}
