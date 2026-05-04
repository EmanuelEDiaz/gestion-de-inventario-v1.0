package com.inventory.application.dto;

import java.util.List;

public record SyncPullResponseDto(
    long nextCursor,
    boolean hasMore,
    List<SyncEntryDto> entries
) {}
