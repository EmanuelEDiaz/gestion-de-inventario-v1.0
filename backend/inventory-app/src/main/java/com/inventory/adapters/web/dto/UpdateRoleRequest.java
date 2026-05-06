package com.inventory.adapters.web.dto;

import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record UpdateRoleRequest(
    @Size(max = 100)
    String name,

    @Size(max = 255)
    String description,

    List<UUID> permissionIds
) {}
