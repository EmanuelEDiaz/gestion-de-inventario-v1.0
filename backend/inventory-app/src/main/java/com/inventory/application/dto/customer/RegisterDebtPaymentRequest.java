package com.inventory.application.customer.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record RegisterDebtPaymentRequest(
    @NotNull @DecimalMin(value = "0.01", message = "Amount must be positive")
    BigDecimal amount,
    String paymentMethod,
    String notes
) {}
