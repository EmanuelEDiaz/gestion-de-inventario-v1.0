package com.inventory.application.dto;

import java.time.Instant;
import java.util.UUID;

public record CustomerImageDto(
    UUID id,
    UUID customerId,
    int sortOrder,
    boolean isPrimary,
    String contentType,
    String filePath,
    String originalFilename,
    long sizeBytes,
    Instant createdAt
) {}
