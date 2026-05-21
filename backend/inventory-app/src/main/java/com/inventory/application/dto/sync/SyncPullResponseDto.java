package com.inventory.application.sync.dto;

import java.util.List;

public record SyncPullResponseDto(
    long nextCursor,
    boolean hasMore,
    List<SyncEntryDto> entries
) {}
