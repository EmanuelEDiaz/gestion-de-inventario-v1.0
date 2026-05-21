package com.inventory.domain.model.customer;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Value Object: Pago de deuda.
 * Registro inmutable de un abono realizado sobre una deuda de cliente.
 */
public record DebtPayment(
    UUID id,
    UUID debtId,
    BigDecimal amount,
    PaymentMethod paymentMethod,
    String notes,
    UUID registeredBy,
    Instant createdAt
) {
    public enum PaymentMethod {
        CASH, TRANSFER, PRODUCT, OTHER
    }

    public DebtPayment {
        if (debtId == null) throw new IllegalArgumentException("debtId cannot be null");
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("amount must be positive");
        if (registeredBy == null) throw new IllegalArgumentException("registeredBy cannot be null");
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public static DebtPayment create(UUID debtId, BigDecimal amount,
                                     PaymentMethod paymentMethod, String notes,
                                     UUID registeredBy) {
        return new DebtPayment(UUID.randomUUID(), debtId, amount, paymentMethod,
                               notes, registeredBy, Instant.now());
    }
}
