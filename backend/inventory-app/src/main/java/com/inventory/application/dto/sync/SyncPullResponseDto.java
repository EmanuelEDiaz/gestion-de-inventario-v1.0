package com.inventory.application.dto.sync;

import java.util.List;

public record SyncPullResponseDto(
    long nextCursor,
    boolean hasMore,
    List<SyncEntryDto> entries
) {}
