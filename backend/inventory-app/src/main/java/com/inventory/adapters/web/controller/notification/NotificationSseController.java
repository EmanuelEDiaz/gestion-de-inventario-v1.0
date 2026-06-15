package com.inventory.adapters.web.controller.notification;

import com.inventory.application.notification.dto.NotificationDto;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.ports.out.NotificationSinkPort;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationSseController {

    private final NotificationSinkPort sinkPort;
    private final SupplementaryApplicationMapper mapper;

    public NotificationSseController(NotificationSinkPort sinkPort,
                                     SupplementaryApplicationMapper mapper) {
        this.sinkPort = sinkPort;
        this.mapper = mapper;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    public Flux<ServerSentEvent<NotificationDto>> stream(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = extractUserId(userDetails);
        var keepAlive = Flux.interval(Duration.ofSeconds(30))
            .map(i -> ServerSentEvent.<NotificationDto>builder()
                .comment("keepalive")
                .build());
        return Flux.merge(
            sinkPort.streamForUser(userId)
                .map(n -> ServerSentEvent.<NotificationDto>builder()
                    .data(mapper.toDto(n, false))
                    .build()),
            keepAlive
        );
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
