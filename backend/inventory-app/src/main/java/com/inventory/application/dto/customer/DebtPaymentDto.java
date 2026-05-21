package com.inventory.application.customer.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record DebtPaymentDto(
    UUID id,
    UUID debtId,
    BigDecimal amount,
    String paymentMethod,
    String notes,
    UUID registeredBy,
    Instant createdAt
) {}
