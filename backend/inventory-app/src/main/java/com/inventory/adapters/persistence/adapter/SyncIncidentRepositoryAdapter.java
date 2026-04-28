package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.mapper.SupplementaryPersistenceMapper;
import com.inventory.adapters.persistence.repository.R2dbcSyncIncidentRepository;
import com.inventory.domain.model.SyncIncident;
import com.inventory.domain.ports.out.SyncIncidentRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class SyncIncidentRepositoryAdapter implements SyncIncidentRepository {

    private final R2dbcSyncIncidentRepository r2dbc;
    private final SupplementaryPersistenceMapper mapper;

    public SyncIncidentRepositoryAdapter(R2dbcSyncIncidentRepository r2dbc,
                                          SupplementaryPersistenceMapper mapper) {
        this.r2dbc = r2dbc;
        this.mapper = mapper;
    }

    @Override
    public Mono<SyncIncident> findById(UUID id) {
        return r2dbc.findById(id).map(mapper::toDomain);
    }

    @Override
    public Flux<SyncIncident> findPending() {
        return r2dbc.findPending().map(mapper::toDomain);
    }

    @Override
    public Flux<SyncIncident> findByDeviceId(String deviceId) {
        return r2dbc.findByDeviceId(deviceId).map(mapper::toDomain);
    }

    @Override
    public Flux<SyncIncident> findByUserId(UUID userId) {
        return r2dbc.findByUserId(userId).map(mapper::toDomain);
    }

    @Override
    public Mono<SyncIncident> save(SyncIncident incident) {
        return r2dbc.findById(incident.getId())
            .flatMap(existing -> r2dbc.save(mapper.toEntity(incident, false)))
            .switchIfEmpty(Mono.defer(() -> r2dbc.save(mapper.toEntity(incident, true))))
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Void> deleteById(UUID id) {
        return r2dbc.deleteById(id);
    }

    @Override
    public Mono<Boolean> existsByOperationId(String operationId) {
        return r2dbc.existsByOperationId(operationId);
    }
}
