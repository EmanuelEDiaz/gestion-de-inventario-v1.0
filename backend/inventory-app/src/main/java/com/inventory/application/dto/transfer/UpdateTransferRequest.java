package com.inventory.application.transfer.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Request para actualizar una transferencia en estado DRAFT.
 */
public record UpdateTransferRequest(
    UUID fromWarehouseId,
    UUID toWarehouseId,
    String notes,
    LocalDate transferDate,
    
    @NotEmpty(message = "At least one line is required")
    @Valid
    List<CreateTransferRequest.LineItem> lines
) {}
