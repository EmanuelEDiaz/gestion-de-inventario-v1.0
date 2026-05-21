package com.inventory.application.customer.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO de respuesta para clientes.
 */
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
    Instant createdAt,
    Instant updatedAt
) {}
