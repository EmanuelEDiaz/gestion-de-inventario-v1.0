package com.inventory.adapters.web.dto;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String username,
    String email,
    String displayName,
    String role,
    boolean isActive,
    Instant createdAt,
    Instant updatedAt
) {}
