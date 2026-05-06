package com.inventory.adapters.web.dto;

import java.util.UUID;

public record UserDirectoryEntry(
    UUID id,
    String displayName,
    String username
) {}
