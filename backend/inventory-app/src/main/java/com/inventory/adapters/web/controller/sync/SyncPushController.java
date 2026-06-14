package com.inventory.adapters.web.controller.sync;

import com.inventory.application.dto.sync.PushBatchRequest;
import com.inventory.application.dto.sync.PushResultDto;
import com.inventory.application.dto.sync.SyncPushResponseDto;
import com.inventory.application.service.CurrentEntityFetcher;
import com.inventory.application.usecase.command.sync.SyncPushUseCase;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/sync")
public class SyncPushController {

    private final SyncPushUseCase syncPushUseCase;
    private final CurrentEntityFetcher currentEntityFetcher;

    public SyncPushController(SyncPushUseCase syncPushUseCase, CurrentEntityFetcher currentEntityFetcher) {
        this.syncPushUseCase = syncPushUseCase;
        this.currentEntityFetcher = currentEntityFetcher;
    }

    @PostMapping("/push")
    @PreAuthorize("isAuthenticated()")
    public Mono<SyncPushResponseDto> push(
        @Valid @RequestBody PushBatchRequest request,
        @AuthenticationPrincipal UserDetails user
    ) {
        var operations = request.operations().stream()
            .map(op -> new SyncPushUseCase.PushOperation(
                op.operationId(),
                op.entityType(),
                op.entityId(),
                op.action(),
                op.payload()
            ))
            .toList();

        Map<String, Object> originalPayloads = request.operations().stream()
            .collect(Collectors.toMap(
                op -> op.operationId(),
                op -> op.payload(),
                (a, b) -> a
            ));

        var userId = extractUserId(user);

        return syncPushUseCase.execute(operations, userId)
            .flatMap(response -> {
                var resultDtos = Flux.fromIterable(response.results())
                    .flatMap(r -> enrichResult(r, originalPayloads))
                    .collectList();
                return resultDtos.map(SyncPushResponseDto::new);
            });
    }

    private Mono<PushResultDto> enrichResult(
        SyncPushUseCase.OperationResult r,
        Map<String, Object> originalPayloads
    ) {
        if (r.accepted()) {
            return Mono.just(new PushResultDto(
                r.operationId(), true, r.data(), null,
                r.entityType(), r.entityId(),
                null, null,
                null, null, null, null
            ));
        }

        Object clientPayload = originalPayloads.getOrDefault(r.operationId(), Collections.emptyMap());

        return currentEntityFetcher.fetchCurrent(r.entityType(), r.entityId())
            .defaultIfEmpty(Collections.emptyMap())
            .zipWith(
                currentEntityFetcher.fetchVersion(r.entityType(), r.entityId())
                    .defaultIfEmpty(null),
                (serverPayload, serverVersion) ->
                    new PushResultDto(
                        r.operationId(), false, r.data(), r.error(),
                        r.entityType(), r.entityId(),
                        r.errorCode(), r.error(),
                        serverPayload, clientPayload,
                        serverVersion, null
                    )
            );
    }

    private UUID extractUserId(UserDetails user) {
        if (user == null) return null;
        try {
            return UUID.fromString(user.getUsername());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
