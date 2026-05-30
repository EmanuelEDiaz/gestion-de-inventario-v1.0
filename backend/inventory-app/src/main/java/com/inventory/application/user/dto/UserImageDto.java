package com.inventory.application.user.dto;

import java.time.Instant;
import java.util.UUID;

public record UserImageDto(
    UUID id,
    UUID userId,
    String contentType,
    String filePath,
    String originalFilename,
    long sizeBytes,
    Instant createdAt
) {}
