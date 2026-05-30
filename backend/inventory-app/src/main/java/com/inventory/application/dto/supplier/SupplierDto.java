package com.inventory.application.supplier.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SupplierDto(
    UUID id,
    String code,
    String name,
    String contactName,
    String phone,
    String email,
    String address,
    String notes,
    boolean active,
    String website,
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
