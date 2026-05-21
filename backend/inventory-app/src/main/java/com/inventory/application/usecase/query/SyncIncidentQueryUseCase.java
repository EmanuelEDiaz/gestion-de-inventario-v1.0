package com.inventory.application.usecase.query;

import com.inventory.domain.model.sync.SyncIncident;
import com.inventory.domain.ports.in.sync.SyncIncidentQueryPort;
import com.inventory.domain.ports.out.SyncIncidentRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.UUID;

/**
 * Caso de uso: consultas sobre incidencias de sincronización.
 */
@Service
public class SyncIncidentQueryUseCase implements SyncIncidentQueryPort {

    private final SyncIncidentRepository syncIncidentRepository;

    public SyncIncidentQueryUseCase(SyncIncidentRepository syncIncidentRepository) {
        this.syncIncidentRepository = syncIncidentRepository;
    }

    @Override
    public Flux<SyncIncident> listPending() {
        return syncIncidentRepository.findPending();
    }

    @Override
    public Flux<SyncIncident> listByDeviceId(String deviceId) {
        return syncIncidentRepository.findByDeviceId(deviceId);
    }

    @Override
    public Flux<SyncIncident> listByUserId(UUID userId) {
        return syncIncidentRepository.findByUserId(userId);
    }
}
