package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.mapper.SupplementaryPersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.NotificationSchedulesR2dbcRepository;
import com.inventory.domain.model.notification.NotificationSchedule;
import com.inventory.domain.ports.out.NotificationSchedulesPort;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class NotificationSchedulesRepositoryAdapter implements NotificationSchedulesPort {

    private final NotificationSchedulesR2dbcRepository r2dbc;
    private final SupplementaryPersistenceMapper mapper;

    public NotificationSchedulesRepositoryAdapter(NotificationSchedulesR2dbcRepository r2dbc,
                                                    SupplementaryPersistenceMapper mapper) {
        this.r2dbc = r2dbc;
        this.mapper = mapper;
    }

    @Override
    public Mono<NotificationSchedule> findByUserId(UUID userId) {
        return r2dbc.findByUserId(userId).map(mapper::toDomain);
    }

    @Override
    public Mono<NotificationSchedule> save(NotificationSchedule schedule) {
        return r2dbc.findById(schedule.id())
            .flatMap(existing -> r2dbc.save(mapper.toEntity(schedule, false)))
            .switchIfEmpty(Mono.defer(() -> r2dbc.save(mapper.toEntity(schedule, true))))
            .map(mapper::toDomain);
    }
}
