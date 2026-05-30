package com.inventory.application.dto.sync;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PushBatchRequest(
    @NotEmpty @Size(max = 100) List<PushOperationRequest> operations
) {}
