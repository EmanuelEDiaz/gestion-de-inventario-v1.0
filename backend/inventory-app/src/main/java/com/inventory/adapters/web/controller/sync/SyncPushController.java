package com.inventory.adapters.web.controller.sync;

import com.inventory.application.dto.sync.PushBatchRequest;
import com.inventory.application.dto.sync.PushResultDto;
import com.inventory.application.dto.sync.SyncPushResponseDto;
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
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sync")
public class SyncPushController {

    private final SyncPushUseCase syncPushUseCase;

    public SyncPushController(SyncPushUseCase syncPushUseCase) {
        this.syncPushUseCase = syncPushUseCase;
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

        var userId = extractUserId(user);

        return syncPushUseCase.execute(operations, userId)
            .map(response -> {
                var results = response.results().stream()
                    .map(r -> new PushResultDto(r.operationId(), r.accepted(), r.data(), r.error()))
                    .toList();
                return new SyncPushResponseDto(results);
            });
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
