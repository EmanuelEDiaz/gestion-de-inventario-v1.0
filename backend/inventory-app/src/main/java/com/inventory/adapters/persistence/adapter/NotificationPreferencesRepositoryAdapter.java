package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.mapper.SupplementaryPersistenceMapper;
import com.inventory.adapters.persistence.repository.NotificationPreferencesR2dbcRepository;
import com.inventory.domain.model.NotificationPreference;
import com.inventory.domain.ports.out.NotificationPreferencesPort;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class NotificationPreferencesRepositoryAdapter implements NotificationPreferencesPort {

    private final NotificationPreferencesR2dbcRepository r2dbc;
    private final SupplementaryPersistenceMapper mapper;

    public NotificationPreferencesRepositoryAdapter(NotificationPreferencesR2dbcRepository r2dbc,
                                                     SupplementaryPersistenceMapper mapper) {
        this.r2dbc = r2dbc;
        this.mapper = mapper;
    }

    @Override
    public Mono<NotificationPreference> findByUserId(UUID userId) {
        return r2dbc.findByUserId(userId).map(mapper::toDomain);
    }

    @Override
    public Mono<NotificationPreference> save(NotificationPreference preference) {
        return r2dbc.findById(preference.id())
            .flatMap(existing -> r2dbc.save(mapper.toEntity(preference, false)))
            .switchIfEmpty(Mono.defer(() -> r2dbc.save(mapper.toEntity(preference, true))))
            .map(mapper::toDomain);
    }
}
