package com.inventory.domain.model.supplier;

import java.time.Instant;
import java.util.UUID;

/**
 * Value Object: Imagen de proveedor.
 * Representa los metadatos de una imagen adjunta a un proveedor.
 */
public record SupplierImage(
    UUID id,
    UUID supplierId,
    int sortOrder,
    boolean isPrimary,
    String contentType,
    String filePath,
    String originalFilename,
    long sizeBytes,
    Instant createdAt
) {
    public SupplierImage {
        if (supplierId == null) throw new IllegalArgumentException("supplierId cannot be null");
        if (contentType == null || contentType.isBlank()) throw new IllegalArgumentException("contentType cannot be blank");
        if (filePath == null || filePath.isBlank()) throw new IllegalArgumentException("filePath cannot be blank");
        if (sizeBytes < 0) throw new IllegalArgumentException("sizeBytes cannot be negative");
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public static SupplierImage create(UUID supplierId, int sortOrder, boolean isPrimary,
                                       String contentType, String filePath,
                                       String originalFilename, long sizeBytes) {
        return new SupplierImage(UUID.randomUUID(), supplierId, sortOrder, isPrimary,
                                 contentType, filePath, originalFilename, sizeBytes, Instant.now());
    }
}
