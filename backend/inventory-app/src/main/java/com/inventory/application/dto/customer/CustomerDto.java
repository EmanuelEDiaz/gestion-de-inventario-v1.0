package com.inventory.application.customer.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
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
    @JsonInclude(Include.ALWAYS) BigDecimal latitude,
    @JsonInclude(Include.ALWAYS) BigDecimal longitude,
    Instant createdAt,
    Instant updatedAt
) {}
