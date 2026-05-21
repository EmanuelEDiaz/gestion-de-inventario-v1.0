package com.inventory.domain.model.customer;

import java.time.Instant;
import java.util.UUID;

/**
 * Value Object: Imagen de cliente.
 * Representa los metadatos de una imagen adjunta a un cliente.
 */
public record CustomerImage(
    UUID id,
    UUID customerId,
    int sortOrder,
    boolean isPrimary,
    String contentType,
    String filePath,
    String originalFilename,
    long sizeBytes,
    Instant createdAt
) {
    public CustomerImage {
        if (customerId == null) throw new IllegalArgumentException("customerId cannot be null");
        if (contentType == null || contentType.isBlank()) throw new IllegalArgumentException("contentType cannot be blank");
        if (filePath == null || filePath.isBlank()) throw new IllegalArgumentException("filePath cannot be blank");
        if (sizeBytes < 0) throw new IllegalArgumentException("sizeBytes cannot be negative");
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public static CustomerImage create(UUID customerId, int sortOrder, boolean isPrimary,
                                       String contentType, String filePath,
                                       String originalFilename, long sizeBytes) {
        return new CustomerImage(UUID.randomUUID(), customerId, sortOrder, isPrimary,
                                 contentType, filePath, originalFilename, sizeBytes, Instant.now());
    }
}
