package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.NotificationSchedulesEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Repositorio R2DBC reactivo para notification_schedules (quiet hours).
 */
public interface NotificationSchedulesR2dbcRepository 
    extends ReactiveCrudRepository<NotificationSchedulesEntity, UUID> {
    
    /**
     * Busca horarios silenciosos por ID de usuario.
     */
    Mono<NotificationSchedulesEntity> findByUserId(UUID userId);
}
