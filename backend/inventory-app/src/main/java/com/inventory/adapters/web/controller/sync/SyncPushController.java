package com.inventory.adapters.web.controller.sync;

import com.inventory.application.usecase.command.sync.SyncPushUseCase;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
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
    public Mono<ResponseEntity<Map<String, Object>>> push(
        @RequestBody Map<String, Object> body,
        @AuthenticationPrincipal UserDetails user
    ) {
        @SuppressWarnings("unchecked")
        var rawOps = (List<Map<String, Object>>) body.get("operations");
        if (rawOps == null || rawOps.isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().body(
                Map.of("error", "operations list is required")
            ));
        }

        var operations = rawOps.stream()
            .map(op -> new SyncPushUseCase.PushOperation(
                (String) op.get("operationId"),
                (String) op.get("entityType"),
                (String) op.get("entityId"),
                (String) op.get("action"),
                op.get("payload")
            ))
            .toList();

        var userId = extractUserId(user);

        return syncPushUseCase.execute(operations, userId)
            .map(response -> ResponseEntity.ok(Map.of("results", response.results())));
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
