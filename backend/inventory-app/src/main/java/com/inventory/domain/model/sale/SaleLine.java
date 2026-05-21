package com.inventory.domain.model.sale;
import com.inventory.domain.model.product.Product;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Value Object: Sale Line
 * Represents a single item in a sale.
 */
public record SaleLine(
    UUID id,
    UUID productId,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal discount,
    BigDecimal totalPrice,
    int sortOrder
) {
    public SaleLine {
        if (id == null) id = UUID.randomUUID();
        if (productId == null) throw new IllegalArgumentException("Product id cannot be null");
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive");
        if (unitPrice == null || unitPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Unit price cannot be negative");
        }
        if (discount == null) discount = BigDecimal.ZERO;
        if (totalPrice == null) {
            totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity)).subtract(discount);
        }
    }

    public static SaleLine create(
        UUID productId,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal discount,
        int sortOrder
    ) {
        BigDecimal total = unitPrice.multiply(BigDecimal.valueOf(quantity))
            .subtract(discount != null ? discount : BigDecimal.ZERO);
        return new SaleLine(UUID.randomUUID(), productId, quantity, unitPrice, 
            discount != null ? discount : BigDecimal.ZERO, total, sortOrder);
    }
}
