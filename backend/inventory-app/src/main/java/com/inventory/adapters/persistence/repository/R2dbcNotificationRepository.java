package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.NotificationEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

public interface R2dbcNotificationRepository extends ReactiveCrudRepository<NotificationEntity, UUID> {

    @Query("SELECT * FROM notifications WHERE target_user_id = :userId ORDER BY created_at DESC")
    Flux<NotificationEntity> findByUserId(UUID userId);

    @Query("""
        SELECT n.* FROM notifications n
        WHERE n.target_user_id = :userId
          AND NOT EXISTS (
              SELECT 1 FROM notification_reads nr
              WHERE nr.notification_id = n.id AND nr.user_id = :userId
          )
        ORDER BY n.created_at DESC
        """)
    Flux<NotificationEntity> findUnreadByUserId(UUID userId);

    @Query("SELECT * FROM notifications WHERE target_type = 'ALL' ORDER BY created_at DESC")
    Flux<NotificationEntity> findBroadcast();

    @Query("DELETE FROM notifications WHERE created_at < :threshold")
    Mono<Void> deleteOlderThan(Instant threshold);
}
