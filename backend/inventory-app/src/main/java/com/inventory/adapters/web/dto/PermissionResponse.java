package com.inventory.adapters.web.dto;

import java.util.UUID;

public record PermissionResponse(
    UUID id,
    String code,
    String name,
    String category
) {}
