package com.inventory.adapters.web.controller;

import com.inventory.application.notification.dto.CreateNotificationRequest;
import com.inventory.application.notification.dto.NotificationDto;
import com.inventory.application.notification.dto.NotificationPreferencesResponse;
import com.inventory.application.notification.dto.NotificationResponse;
import com.inventory.application.notification.dto.NotificationScheduleResponse;
import com.inventory.application.notification.dto.SendMessageRequest;
import com.inventory.application.notification.dto.UpdateNotificationPreferencesRequest;
import com.inventory.application.notification.dto.UpdateNotificationScheduleRequest;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.application.service.NotificationPreferencesService;
import com.inventory.application.service.NotificationSchedulesService;
import com.inventory.domain.model.notification.Notification;
import com.inventory.domain.ports.in.AdminUserQueryPort;
import com.inventory.domain.ports.in.NotificationCommandPort;
import com.inventory.domain.ports.in.NotificationQueryPort;
import com.inventory.domain.shared.PageRequest;
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
    private final NotificationPreferencesService preferencesService;
    private final NotificationSchedulesService schedulesService;
    private final AdminUserQueryPort userQuery;

    public NotificationController(NotificationCommandPort commandPort,
                                  NotificationQueryPort queryPort,
                                  SupplementaryApplicationMapper mapper,
                                  NotificationPreferencesService preferencesService,
                                  NotificationSchedulesService schedulesService,
                                  AdminUserQueryPort userQuery) {
        this.commandPort = commandPort;
        this.queryPort = queryPort;
        this.mapper = mapper;
        this.preferencesService = preferencesService;
        this.schedulesService = schedulesService;
        this.userQuery = userQuery;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Flux<NotificationDto> list(
        @RequestParam(defaultValue = "false") boolean includeRead,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = extractUserId(userDetails);
        return queryPort.listForUser(userId, includeRead)
            .flatMap(n -> enrichWithSenderName(n).map(name -> mapper.toDto(n, false, name)));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public Mono<Long> unreadCount(@AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = extractUserId(userDetails);
        if (userId == null) {
            return Mono.just(0L);
        }
        return queryPort.getUnreadCount(userId);
    }

    @GetMapping("/system")
    @PreAuthorize("isAuthenticated()")
    public Flux<NotificationResponse> listSystem(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = extractUserId(userDetails);
        var pageRequest = PageRequest.of(page, size);
        return queryPort.listSystemNotifications(userId, pageRequest)
            .map(n -> mapper.toNotificationResponse(n, false));
    }

    @GetMapping("/users")
    @PreAuthorize("isAuthenticated()")
    public Flux<NotificationResponse> listUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = extractUserId(userDetails);
        var pageRequest = PageRequest.of(page, size);
        return queryPort.listUserNotifications(userId, pageRequest)
            .map(n -> mapper.toNotificationResponse(n, false));
    }

    @GetMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    public Mono<NotificationPreferencesResponse> getPreferences(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = extractUserId(userDetails);
        return preferencesService.getPreferences(userId);
    }

    @PutMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    public Mono<NotificationPreferencesResponse> updatePreferences(
        @Valid @RequestBody UpdateNotificationPreferencesRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = extractUserId(userDetails);
        return preferencesService.updatePreferences(userId, request);
    }

    @GetMapping("/schedules")
    @PreAuthorize("isAuthenticated()")
    public Mono<NotificationScheduleResponse> getSchedule(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = extractUserId(userDetails);
        return schedulesService.getSchedule(userId);
    }

    @PutMapping("/schedules")
    @PreAuthorize("isAuthenticated()")
    public Mono<NotificationScheduleResponse> updateSchedule(
        @Valid @RequestBody UpdateNotificationScheduleRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = extractUserId(userDetails);
        return schedulesService.updateSchedule(userId, request);
    }

    @PostMapping("/send")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public Mono<NotificationDto> send(
        @Valid @RequestBody SendMessageRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID senderId = extractUserId(userDetails);
        UUID targetUserId = UUID.fromString(request.targetUserId());
        return commandPort.create(new NotificationCommandPort.CreateCommand(
            request.title(),
            request.body(),
            Notification.NotificationCategory.MANUAL,
            Notification.TargetType.USER,
            targetUserId,
            senderId
        )).flatMap(n -> enrichWithSenderName(n).map(name -> mapper.toDto(n, false, name)));
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

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return commandPort.deleteById(id, extractUserId(userDetails));
    }

    private UUID extractUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        try {
            return UUID.fromString(userDetails.getUsername());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /** Resuelve el displayName del emisor si source=USER; devuelve Mono<null> en otros casos. */
    private Mono<String> enrichWithSenderName(Notification n) {
        if (n.createdBy() == null || n.source() != Notification.NotificationSource.USER) {
            return Mono.justOrEmpty((String) null);
        }
        return userQuery.findById(n.createdBy())
            .map(u -> u.getDisplayName())
            .defaultIfEmpty("Usuario desconocido")
            .onErrorReturn("Usuario desconocido");
    }
}
