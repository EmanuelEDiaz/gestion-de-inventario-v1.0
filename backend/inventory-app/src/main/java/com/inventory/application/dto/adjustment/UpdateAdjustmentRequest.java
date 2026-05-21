package com.inventory.application.adjustment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO para actualizar un ajuste de inventario.
 */
public record UpdateAdjustmentRequest(
    @NotNull(message = "Type is required")
    String type,

    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    String reason,

    @Size(max = 1000, message = "Notes cannot exceed 1000 characters")
    String notes,

    @NotNull(message = "Lines are required")
    @Size(min = 1, message = "At least one line is required")
    List<LineRequest> lines
) {
    public record LineRequest(
        @NotNull(message = "Product ID is required")
        UUID productId,

        @NotNull(message = "System quantity is required")
        BigDecimal systemQty,

        @NotNull(message = "Counted quantity is required")
        BigDecimal countedQty,

        BigDecimal unitCost
    ) {}
}
