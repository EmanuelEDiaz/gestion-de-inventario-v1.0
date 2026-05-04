package com.inventory.domain.ports.out;

import com.inventory.domain.model.SyncIncident;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida: Repositorio de incidencias de sincronización.
 */
public interface SyncIncidentRepository {

    Mono<SyncIncident> findById(UUID id);

    Flux<SyncIncident> findPending();

    Flux<SyncIncident> findByDeviceId(String deviceId);

    Flux<SyncIncident> findByUserId(UUID userId);

    Mono<SyncIncident> save(SyncIncident incident);

    Mono<Void> deleteById(UUID id);

    Mono<Boolean> existsByOperationId(String operationId);
}
