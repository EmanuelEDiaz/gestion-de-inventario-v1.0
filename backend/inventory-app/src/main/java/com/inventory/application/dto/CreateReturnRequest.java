package com.inventory.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO para crear una devolución.
 */
public record CreateReturnRequest(
    @NotNull(message = "Type is required")
    String type,

    @NotNull(message = "Warehouse is required")
    UUID warehouseId,

    UUID originalDocumentId,

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

        @NotNull(message = "Quantity is required")
        BigDecimal quantity,

        @NotNull(message = "Unit price is required")
        BigDecimal unitPrice,

        BigDecimal unitCost
    ) {}
}
