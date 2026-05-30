package com.inventory.adapters.web.controller.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.adapters.persistence.adapter.repository.R2dbcSyncLogRepository;
import com.inventory.application.dto.sync.SyncEntryDto;
import com.inventory.application.dto.sync.SyncPullResponseDto;
import com.inventory.application.usecase.query.sync.SyncChecksumUseCase;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.UUID;

/**
 * Sync pull endpoint para offline-first PWA.
 * GET /api/v1/sync/pull?cursor=X retorna entradas de sync_log desde ese cursor.
 */
@RestController
@RequestMapping("/api/v1/sync")
public class SyncController {

    private static final int PAGE_SIZE = 200;
    private final R2dbcSyncLogRepository syncLogRepo;
    private final ObjectMapper objectMapper;
    private final SyncChecksumUseCase checksumUseCase;

    public SyncController(
        R2dbcSyncLogRepository syncLogRepo,
        ObjectMapper objectMapper,
        SyncChecksumUseCase checksumUseCase
    ) {
        this.syncLogRepo = syncLogRepo;
        this.objectMapper = objectMapper;
        this.checksumUseCase = checksumUseCase;
    }

    @GetMapping("/pull")
    @PreAuthorize("isAuthenticated()")
    public Mono<SyncPullResponseDto> pull(
        @RequestParam(defaultValue = "0") long cursor,
        @RequestParam(required = false) String entityType
    ) {
        var flux = entityType != null
            ? syncLogRepo.findAfterCursor(cursor, PAGE_SIZE + 1, entityType)
            : syncLogRepo.findAfterCursor(cursor, PAGE_SIZE + 1);
        return flux.collectList()
            .map(list -> {
                boolean hasMore = list.size() > PAGE_SIZE;
                var entries = list.stream()
                    .limit(PAGE_SIZE)
                    .map(e -> {
                        Object parsed = parsePayload(e.getPayload());
                        return new SyncEntryDto(
                            e.getId(), e.getEntityType(), e.getEntityId(),
                            e.getAction(), parsed, e.getWarehouseId(), e.getCreatedAt()
                        );
                    })
                    .toList();
                long nextCursor = entries.isEmpty() ? cursor : entries.getLast().cursor();
                return new SyncPullResponseDto(nextCursor, hasMore, entries);
            });
    }

    @GetMapping("/checksums")
    @PreAuthorize("isAuthenticated()")
    public Mono<Map<String, SyncChecksumUseCase.StoreChecksum>> checksums() {
        return checksumUseCase.computeChecksums();
    }

    private Object parsePayload(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception e) {
            return json;
        }
    }
}
