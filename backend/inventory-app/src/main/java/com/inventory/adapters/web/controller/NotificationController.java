package com.inventory.adapters.web.controller;

import com.inventory.application.dto.CreateNotificationRequest;
import com.inventory.application.dto.NotificationDto;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.model.Notification;
import com.inventory.domain.ports.in.NotificationCommandPort;
import com.inventory.domain.ports.in.NotificationQueryPort;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationCommandPort commandPort;
    private final NotificationQueryPort queryPort;
    private final SupplementaryApplicationMapper mapper;

    public NotificationController(NotificationCommandPort commandPort,
                                  NotificationQueryPort queryPort,
                                  SupplementaryApplicationMapper mapper) {
        this.commandPort = commandPort;
        this.queryPort = queryPort;
        this.mapper = mapper;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Flux<NotificationDto> list(
        @RequestParam(defaultValue = "false") boolean includeRead,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = extractUserId(userDetails);
        return queryPort.listForUser(userId, includeRead)
            .map(n -> mapper.toDto(n, false));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public Mono<Long> unreadCount(@AuthenticationPrincipal UserDetails userDetails) {
        return queryPort.getUnreadCount(extractUserId(userDetails));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<NotificationDto> create(
        @Valid @RequestBody CreateNotificationRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = extractUserId(userDetails);
        UUID targetUserId = request.targetUserId() != null
            ? UUID.fromString(request.targetUserId()) : null;
        return commandPort.create(new NotificationCommandPort.CreateCommand(
            request.title(),
            request.body(),
            Notification.NotificationCategory.valueOf(request.category()),
            Notification.TargetType.valueOf(request.targetType()),
            targetUserId,
            userId
        )).map(n -> mapper.toDto(n, false));
    }

    @PostMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public Mono<Void> markRead(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return commandPort.markRead(id, extractUserId(userDetails));
    }

    @PostMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public Mono<Void> markAllRead(@AuthenticationPrincipal UserDetails userDetails) {
        return commandPort.markAllRead(extractUserId(userDetails));
    }

    private UUID extractUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        try {
            return UUID.fromString(userDetails.getUsername());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
