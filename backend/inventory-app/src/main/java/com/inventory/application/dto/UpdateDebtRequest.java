package com.inventory.application.dto;

import java.time.Instant;

public record UpdateDebtRequest(
    String description,
    Instant dueDate,
    String notes
) {}
