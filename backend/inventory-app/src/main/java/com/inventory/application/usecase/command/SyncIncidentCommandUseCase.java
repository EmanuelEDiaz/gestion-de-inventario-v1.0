package com.inventory.application.usecase.command;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.SyncIncident;
import com.inventory.domain.ports.in.SyncIncidentCommandPort;
import com.inventory.domain.ports.out.SyncIncidentRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: comandos sobre incidencias de sincronización.
 * Cubre: reportar (crear), resolver e ignorar.
 */
@Service
public class SyncIncidentCommandUseCase implements SyncIncidentCommandPort {

    private final SyncIncidentRepository syncIncidentRepository;

    public SyncIncidentCommandUseCase(SyncIncidentRepository syncIncidentRepository) {
        this.syncIncidentRepository = syncIncidentRepository;
    }

    @Override
    public Mono<SyncIncident> report(ReportCommand command) {
        return syncIncidentRepository.existsByOperationId(command.operationId())
            .flatMap(exists -> {
                if (exists) {
                    return syncIncidentRepository.findByDeviceId(command.deviceId())
                        .filter(i -> i.getOperationId().equals(command.operationId()))
                        .next();
                }
                SyncIncident incident = SyncIncident.create(
                    command.deviceId(),
                    command.operationId(),
                    command.entityType(),
                    command.entityId(),
                    command.incidentType(),
                    command.myPayload(),
                    command.serverPayload(),
                    command.userId()
                );
                return syncIncidentRepository.save(incident);
            });
    }

    @Override
    public Mono<SyncIncident> resolve(UUID incidentId, String resolution) {
        return syncIncidentRepository.findById(incidentId)
            .switchIfEmpty(Mono.error(new NotFoundException("SyncIncident not found: " + incidentId)))
            .map(incident -> incident.resolve(resolution))
            .flatMap(syncIncidentRepository::save);
    }

    @Override
    public Mono<SyncIncident> ignore(UUID incidentId) {
        return syncIncidentRepository.findById(incidentId)
            .switchIfEmpty(Mono.error(new NotFoundException("SyncIncident not found: " + incidentId)))
            .map(SyncIncident::ignore)
            .flatMap(syncIncidentRepository::save);
    }
}
