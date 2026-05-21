package com.inventory.domain.ports.in;

import com.inventory.domain.model.sync.SyncIncident;
import reactor.core.publisher.Flux;

import java.util.UUID;

/**
 * Puerto de entrada para consultas de incidencias de sincronización.
 */
public interface SyncIncidentQueryPort {

    Flux<SyncIncident> listPending();

    Flux<SyncIncident> listByDeviceId(String deviceId);

    Flux<SyncIncident> listByUserId(UUID userId);
}
