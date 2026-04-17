package com.inventory.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Request para crear una transferencia.
 */
public record CreateTransferRequest(
    @NotNull(message = "Origin warehouse is required")
    UUID fromWarehouseId,
    
    @NotNull(message = "Destination warehouse is required")
    UUID toWarehouseId,
    
    String notes,
    LocalDate transferDate,
    
    @NotEmpty(message = "At least one line is required")
    @Valid
    List<LineItem> lines
) {
    public record LineItem(
        @NotNull(message = "Product ID is required")
        UUID productId,
        
        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be positive")
        BigDecimal quantity
    ) {}
}
