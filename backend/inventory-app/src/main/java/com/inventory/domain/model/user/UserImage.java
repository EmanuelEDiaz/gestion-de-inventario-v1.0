package com.inventory.domain.model.user;

import java.time.Instant;
import java.util.UUID;

public record UserImage(
    UUID id,
    UUID userId,
    String contentType,
    String filePath,
    String originalFilename,
    long sizeBytes,
    Instant createdAt
) {
    public UserImage {
        if (userId == null) throw new IllegalArgumentException("userId cannot be null");
        if (contentType == null || contentType.isBlank()) throw new IllegalArgumentException("contentType cannot be blank");
        if (filePath == null || filePath.isBlank()) throw new IllegalArgumentException("filePath cannot be blank");
        if (sizeBytes < 0) throw new IllegalArgumentException("sizeBytes cannot be negative");
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public static UserImage create(UUID userId, String contentType, String filePath,
                                   String originalFilename, long sizeBytes) {
        return new UserImage(UUID.randomUUID(), userId, contentType, filePath,
                             originalFilename, sizeBytes, Instant.now());
    }
}
