package com.inventory.adapters.web.dto;

import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateUserRequest(
    @Size(max = 255) String email,
    @Size(max = 200) String displayName,
    UUID roleId,
    Boolean isActive
) {}
