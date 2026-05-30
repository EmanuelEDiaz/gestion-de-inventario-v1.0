package com.inventory.adapters.web.controller.sync;

import com.inventory.application.dto.sync.ReportSyncIncidentRequest;
import com.inventory.application.dto.sync.ResolveSyncIncidentRequest;
import com.inventory.application.dto.sync.SyncIncidentDto;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.model.sync.SyncIncident;
import com.inventory.domain.ports.in.sync.SyncIncidentCommandPort;
import com.inventory.domain.ports.in.sync.SyncIncidentQueryPort;
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
@RequestMapping("/api/v1/sync/incidents")
public class SyncIncidentController {

    private final SyncIncidentCommandPort commandPort;
    private final SyncIncidentQueryPort queryPort;
    private final SupplementaryApplicationMapper mapper;

    public SyncIncidentController(SyncIncidentCommandPort commandPort,
                                  SyncIncidentQueryPort queryPort,
                                  SupplementaryApplicationMapper mapper) {
        this.commandPort = commandPort;
        this.queryPort = queryPort;
        this.mapper = mapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Flux<SyncIncidentDto> listPending(
        @RequestParam(required = false) String deviceId
    ) {
        if (deviceId != null) {
            return queryPort.listByDeviceId(deviceId).map(mapper::toDto);
        }
        return queryPort.listPending().map(mapper::toDto);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public Mono<SyncIncidentDto> report(
        @Valid @RequestBody ReportSyncIncidentRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = extractUserId(userDetails);
        return commandPort.report(new SyncIncidentCommandPort.ReportCommand(
            request.deviceId(),
            request.operationId(),
            request.entityType(),
            request.entityId(),
            SyncIncident.IncidentType.valueOf(request.incidentType()),
            request.myPayload(),
            request.serverPayload(),
            userId
        )).map(mapper::toDto);
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<SyncIncidentDto> resolve(
        @PathVariable UUID id,
        @Valid @RequestBody ResolveSyncIncidentRequest request
    ) {
        return commandPort.resolve(id, request.resolution()).map(mapper::toDto);
    }

    @PostMapping("/{id}/ignore")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<SyncIncidentDto> ignore(@PathVariable UUID id) {
        return commandPort.ignore(id).map(mapper::toDto);
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
