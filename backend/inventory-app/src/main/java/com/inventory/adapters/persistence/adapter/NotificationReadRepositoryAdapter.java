package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.NotificationReadEntity;
import com.inventory.adapters.persistence.adapter.mapper.SupplementaryPersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.R2dbcNotificationReadRepository;
import com.inventory.domain.model.notification.NotificationRead;
import com.inventory.domain.ports.out.NotificationReadRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class NotificationReadRepositoryAdapter implements NotificationReadRepository {

    private final R2dbcNotificationReadRepository r2dbc;
    private final SupplementaryPersistenceMapper mapper;

    public NotificationReadRepositoryAdapter(R2dbcNotificationReadRepository r2dbc,
                                              SupplementaryPersistenceMapper mapper) {
        this.r2dbc = r2dbc;
        this.mapper = mapper;
    }

    @Override
    public Mono<Boolean> hasRead(UUID notificationId, UUID userId) {
        return r2dbc.existsByNotificationIdAndUserId(notificationId, userId);
    }

    @Override
    public Mono<NotificationRead> save(NotificationRead read) {
        NotificationReadEntity entity = mapper.toEntity(read);
        return r2dbc.save(entity).map(mapper::toDomain);
    }

    @Override
    public Flux<UUID> findReadNotificationIdsByUserId(UUID userId) {
        return r2dbc.findNotificationIdsByUserId(userId);
    }

    @Override
    public Mono<Long> countUnreadByUserId(UUID userId) {
        return r2dbc.countUnreadByUserId(userId);
    }

    @Override
    public Mono<Void> deleteByNotificationId(UUID notificationId) {
        return r2dbc.deleteByNotificationId(notificationId);
    }
}
