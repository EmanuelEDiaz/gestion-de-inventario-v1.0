package com.inventory.application.supplier.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO de respuesta para proveedores.
 */
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
    Instant createdAt,
    Instant updatedAt
) {}
