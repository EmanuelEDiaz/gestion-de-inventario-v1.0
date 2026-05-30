package com.inventory.adapters.web.dto.user;

import com.inventory.adapters.web.dto.role.RoleResponse;
import java.time.Instant;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String username,
    String email,
    String displayName,
    RoleResponse role,
    boolean isActive,
    String avatarUrl,
    Instant createdAt,
    Instant updatedAt
) {}
