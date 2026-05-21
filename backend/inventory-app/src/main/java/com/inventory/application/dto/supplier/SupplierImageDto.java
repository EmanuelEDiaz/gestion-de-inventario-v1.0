package com.inventory.application.supplier.dto;

import java.time.Instant;
import java.util.UUID;

public record SupplierImageDto(
    UUID id,
    UUID supplierId,
    int sortOrder,
    boolean isPrimary,
    String contentType,
    String filePath,
    String originalFilename,
    long sizeBytes,
    Instant createdAt
) {}
