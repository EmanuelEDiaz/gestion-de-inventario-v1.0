package com.inventory.application.dto.sync;

import java.util.List;

public record SyncPushResponseDto(
    List<PushResultDto> results
) {}
