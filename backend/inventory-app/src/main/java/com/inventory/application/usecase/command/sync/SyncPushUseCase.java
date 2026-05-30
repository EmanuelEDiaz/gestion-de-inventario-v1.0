package com.inventory.application.usecase.command.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.application.service.IdempotencyService;
import com.inventory.application.service.OperationRouter;
import com.inventory.domain.ports.out.SyncLogWriterPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SyncPushUseCase {

    private final OperationRouter operationRouter;
    private final IdempotencyService idempotencyService;
    private final SyncLogWriterPort syncLogWriter;
    private final ObjectMapper objectMapper;

    public SyncPushUseCase(
        OperationRouter operationRouter,
        IdempotencyService idempotencyService,
        SyncLogWriterPort syncLogWriter,
        ObjectMapper objectMapper
    ) {
        this.operationRouter = operationRouter;
        this.idempotencyService = idempotencyService;
        this.syncLogWriter = syncLogWriter;
        this.objectMapper = objectMapper;
    }

    public Mono<SyncPushResponse> execute(List<PushOperation> operations, UUID userId) {
        if (operations.size() > 100) {
            return Mono.error(new IllegalArgumentException("Máximo 100 operaciones por batch"));
        }
        return Flux.fromIterable(operations)
            .flatMapSequential(op -> processOperation(op, userId))
            .collectList()
            .map(SyncPushResponse::new);
    }

    private Mono<OperationResult> processOperation(PushOperation op, UUID userId) {
        var hash = op.operationId() + ":" + op.entityType() + ":" + op.action();

        return idempotencyService.getCachedResponse(op.operationId())
            .flatMap(cached -> {
                if (cached != null) {
                    String entityId = extractEntityIdFromJson(cached);
                    return Mono.just(new OperationResult(op.operationId(), true, cached, null, entityId));
                }
                return resolveAndRoute(op, userId, hash);
            })
            .switchIfEmpty(resolveAndRoute(op, userId, hash));
    }

    private Mono<OperationResult> resolveAndRoute(PushOperation op, UUID userId, String hash) {
        return resolveTempIds(op).flatMap(resolvedOp -> routeAndStore(resolvedOp, userId, hash));
    }

    @SuppressWarnings("unchecked")
    private Mono<PushOperation> resolveTempIds(PushOperation op) {
        String entityId = op.entityId();
        if (entityId == null || entityId.isBlank()) return Mono.just(op);
        if (!entityId.startsWith("temp_")) {
            try {
                UUID.fromString(entityId);
                return Mono.just(op);
            } catch (IllegalArgumentException ignored) {}
        }
        return idempotencyService.findRealIdByTempId(entityId)
            .map(realId -> {
                Object resolvedPayload = replaceTempIdInPayload(op.payload(), entityId, realId);
                return new PushOperation(
                    op.operationId(),
                    op.entityType(),
                    realId,
                    op.action(),
                    resolvedPayload
                );
            })
            .defaultIfEmpty(op);
    }

    private Object replaceTempIdInPayload(Object payload, String tempId, String realId) {
        if (payload instanceof Map<?, ?> map) {
            Map<String, Object> mutable = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                String key = entry.getKey().toString();
                Object value = entry.getValue();
                if (tempId.equals(value)) {
                    mutable.put(key, realId);
                } else if (value instanceof Map) {
                    mutable.put(key, replaceTempIdInPayload(value, tempId, realId));
                } else {
                    mutable.put(key, value);
                }
            }
            return mutable;
        }
        return payload;
    }

    private Mono<OperationResult> routeAndStore(PushOperation op, UUID userId, String hash) {
        return operationRouter.route(op.entityType(), op.action(), op.payload(), userId)
            .flatMap(result -> {
                if (result.success()) {
                    String responseJson = result.data() != null ? result.data().toString() : "{}";
                    String entityId = op.entityId();
                    if ("CREATE".equals(op.action()) && entityId != null && entityId.startsWith("temp_")) {
                        String realId = extractEntityId(result.data());
                        if (realId != null) entityId = realId;
                    }
                    return idempotencyService.checkAndStore(op.operationId(), hash, responseJson)
                        .then(writeSyncLog(op, userId))
                        .thenReturn(new OperationResult(op.operationId(), true, result.data(), null, entityId));
                }
                return Mono.just(new OperationResult(op.operationId(), false, null,
                    result.data() != null ? result.data().toString() : "Unknown error", op.entityId()));
            })
            .onErrorResume(e ->
                Mono.just(new OperationResult(op.operationId(), false, null, e.getMessage(), op.entityId())));
    }

    private Mono<Void> writeSyncLog(PushOperation op, UUID userId) {
        UUID entityId = null;
        if (op.entityId() != null && !op.entityId().isBlank()) {
            try { entityId = UUID.fromString(op.entityId()); }
            catch (IllegalArgumentException ignored) {}
        }
        return syncLogWriter.log(
            op.entityType(),
            entityId,
            op.action(),
            op.payload(),
            null
        );
    }

    private String extractEntityId(Object data) {
        if (data == null) return null;
        try {
            Map<String, Object> map = objectMapper.convertValue(data, Map.class);
            Object id = map.get("id");
            return id != null ? id.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String extractEntityIdFromJson(String json) {
        if (json == null) return null;
        if (json.contains("\"realId\"")) {
            int start = json.indexOf("\"realId\":\"") + 10;
            int end = json.indexOf("\"", start);
            if (start > 9 && end > start) return json.substring(start, end);
        }
        if (json.contains("\"id\"")) {
            int start = json.indexOf("\"id\":\"") + 6;
            int end = json.indexOf("\"", start);
            if (start > 5 && end > start) return json.substring(start, end);
        }
        return null;
    }

    public record PushOperation(
        String operationId,
        String entityType,
        String entityId,
        String action,
        Object payload
    ) {}

    public record SyncPushResponse(List<OperationResult> results) {}

    public record OperationResult(
        String operationId,
        boolean accepted,
        Object data,
        String error,
        String entityId
    ) {
        public OperationResult(String operationId, boolean accepted, Object data, String error) {
            this(operationId, accepted, data, error, null);
        }
    }
}
