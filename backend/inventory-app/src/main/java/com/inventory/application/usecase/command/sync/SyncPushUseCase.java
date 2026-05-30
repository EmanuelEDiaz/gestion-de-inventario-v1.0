package com.inventory.application.usecase.command.sync;

import com.inventory.application.service.IdempotencyService;
import com.inventory.application.service.OperationRouter;
import com.inventory.domain.ports.out.SyncLogWriterPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

@Service
public class SyncPushUseCase {

    private final OperationRouter operationRouter;
    private final IdempotencyService idempotencyService;
    private final SyncLogWriterPort syncLogWriter;

    public SyncPushUseCase(
        OperationRouter operationRouter,
        IdempotencyService idempotencyService,
        SyncLogWriterPort syncLogWriter
    ) {
        this.operationRouter = operationRouter;
        this.idempotencyService = idempotencyService;
        this.syncLogWriter = syncLogWriter;
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
                    return Mono.just(new OperationResult(op.operationId(), true, cached, null));
                }
                return routeAndStore(op, userId, hash);
            })
            .switchIfEmpty(routeAndStore(op, userId, hash));
    }

    private Mono<OperationResult> routeAndStore(PushOperation op, UUID userId, String hash) {
        return operationRouter.route(op.entityType(), op.action(), op.payload(), userId)
            .flatMap(result -> {
                if (result.success()) {
                    String responseJson = result.data() != null ? result.data().toString() : "{}";
                    return idempotencyService.checkAndStore(op.operationId(), hash, responseJson)
                        .then(writeSyncLog(op, userId))
                        .thenReturn(new OperationResult(op.operationId(), true, result.data(), null));
                }
                return Mono.just(new OperationResult(op.operationId(), false, null,
                    result.data() != null ? result.data().toString() : "Unknown error"));
            })
            .onErrorResume(e ->
                Mono.just(new OperationResult(op.operationId(), false, null, e.getMessage())));
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
        String error
    ) {}
}
