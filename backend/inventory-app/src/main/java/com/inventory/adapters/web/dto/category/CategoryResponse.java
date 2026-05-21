package com.inventory.adapters.web.dto.category;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO de respuesta para Categoría.
 */
public record CategoryResponse(
    UUID id,
    UUID parentId,
    String name,
    String path,
    int level,
    int sortOrder,
    boolean active,
    Instant createdAt,
    Instant updatedAt,
    int version
) {}
