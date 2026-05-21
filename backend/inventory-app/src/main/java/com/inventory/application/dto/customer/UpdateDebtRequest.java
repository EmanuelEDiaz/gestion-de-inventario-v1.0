package com.inventory.application.customer.dto;

import java.time.Instant;

public record UpdateDebtRequest(
    String description,
    Instant dueDate,
    String notes
) {}
