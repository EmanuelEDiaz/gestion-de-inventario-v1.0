package com.inventory.application.customer.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CustomerDebtDto(
    UUID id,
    UUID customerId,
    UUID saleId,
    BigDecimal originalAmount,
    BigDecimal paidAmount,
    BigDecimal pendingAmount,
    String currencyCode,
    String status,
    String description,
    Instant dueDate,
    String notes,
    Instant createdAt,
    Instant updatedAt
) {}
