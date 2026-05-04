package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.mapper.SupplementaryPersistenceMapper;
import com.inventory.adapters.persistence.repository.R2dbcNotificationRepository;
import com.inventory.domain.model.Notification;
import com.inventory.domain.ports.out.NotificationRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

@Repository
public class NotificationRepositoryAdapter implements NotificationRepository {

    private final R2dbcNotificationRepository r2dbc;
    private final SupplementaryPersistenceMapper mapper;

    public NotificationRepositoryAdapter(R2dbcNotificationRepository r2dbc,
                                          SupplementaryPersistenceMapper mapper) {
        this.r2dbc = r2dbc;
        this.mapper = mapper;
    }

    @Override
    public Mono<Notification> findById(UUID id) {
        return r2dbc.findById(id).map(mapper::toDomain);
    }

    @Override
    public Flux<Notification> findByUserId(UUID userId) {
        return r2dbc.findByUserId(userId).map(mapper::toDomain);
    }

    @Override
    public Flux<Notification> findUnreadByUserId(UUID userId) {
        return r2dbc.findUnreadByUserId(userId).map(mapper::toDomain);
    }

    @Override
    public Flux<Notification> findBroadcast() {
        return r2dbc.findBroadcast().map(mapper::toDomain);
    }

    @Override
    public Mono<Notification> save(Notification notification) {
        return r2dbc.findById(notification.id())
            .flatMap(existing -> r2dbc.save(mapper.toEntity(notification, false)))
            .switchIfEmpty(Mono.defer(() -> r2dbc.save(mapper.toEntity(notification, true))))
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Void> deleteById(UUID id) {
        return r2dbc.deleteById(id);
    }

    @Override
    public Mono<Void> deleteOlderThan(Instant threshold) {
        return r2dbc.deleteOlderThan(threshold);
    }
}
