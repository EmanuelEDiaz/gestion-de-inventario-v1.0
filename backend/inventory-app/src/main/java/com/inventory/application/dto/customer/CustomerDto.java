package com.inventory.application.customer.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CustomerDto(
    UUID id,
    String code,
    String name,
    String contactName,
    String phone,
    String email,
    String address,
    String notes,
    boolean active,
    String province,
    String municipality,
    String street,
    String locality,
    String zipCode,
    BigDecimal latitude,
    BigDecimal longitude,
    Instant createdAt,
    Instant updatedAt
) {}
