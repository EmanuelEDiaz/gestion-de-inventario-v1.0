package com.inventory.domain.model.product;

import java.time.Instant;
import java.util.UUID;

public record ProductImage(
    UUID id,
    UUID productId,
    int sortOrder,
    boolean isPrimary,
    String contentType,
    String filePath,
    String originalFilename,
    long sizeBytes,
    Instant createdAt
) {
    public ProductImage {
        if (productId == null) throw new IllegalArgumentException("productId cannot be null");
        if (contentType == null || contentType.isBlank()) throw new IllegalArgumentException("contentType cannot be blank");
        if (filePath == null || filePath.isBlank()) throw new IllegalArgumentException("filePath cannot be blank");
        if (sizeBytes < 0) throw new IllegalArgumentException("sizeBytes cannot be negative");
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public static ProductImage create(UUID productId, int sortOrder, boolean isPrimary,
                                       String contentType, String filePath,
                                       String originalFilename, long sizeBytes) {
        return new ProductImage(UUID.randomUUID(), productId, sortOrder, isPrimary,
            contentType, filePath, originalFilename, sizeBytes, Instant.now());
    }
}