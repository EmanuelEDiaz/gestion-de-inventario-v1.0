package com.inventory.domain.ports.in;

import com.inventory.domain.model.sync.SyncIncident;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada para comandos de incidencias de sincronización.
 */
public interface SyncIncidentCommandPort {

    Mono<SyncIncident> report(ReportCommand command);

    Mono<SyncIncident> resolve(UUID incidentId, String resolution);

    Mono<SyncIncident> ignore(UUID incidentId);

    record ReportCommand(
        String deviceId,
        String operationId,
        String entityType,
        String entityId,
        SyncIncident.IncidentType incidentType,
        String myPayload,
        String serverPayload,
        UUID userId
    ) {}
}
