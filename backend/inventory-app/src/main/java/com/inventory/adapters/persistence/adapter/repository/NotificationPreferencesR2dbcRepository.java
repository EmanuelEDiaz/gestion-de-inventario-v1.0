package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.NotificationPreferencesEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Repositorio R2DBC reactivo para notification_preferences.
 */
public interface NotificationPreferencesR2dbcRepository 
    extends ReactiveCrudRepository<NotificationPreferencesEntity, UUID> {
    
    /**
     * Busca preferencias por ID de usuario.
     */
    Mono<NotificationPreferencesEntity> findByUserId(UUID userId);
}
