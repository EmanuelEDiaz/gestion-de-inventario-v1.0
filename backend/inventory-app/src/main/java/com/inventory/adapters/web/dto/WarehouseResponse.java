package com.inventory.adapters.web.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO de respuesta para Almacén.
 */
public record WarehouseResponse(
    UUID id,
    String code,
    String name,
    String address,
    boolean active,
    Instant createdAt,
    Instant updatedAt,
    int version
) {}
