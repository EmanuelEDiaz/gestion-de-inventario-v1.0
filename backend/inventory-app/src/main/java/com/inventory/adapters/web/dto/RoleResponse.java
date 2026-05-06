package com.inventory.adapters.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record RoleResponse(
    UUID id,
    String code,
    String name,
    String description,
    boolean isSystem,
    boolean isActive,
    List<PermissionResponse> permissions,
    Instant createdAt,
    Instant updatedAt
) {}
