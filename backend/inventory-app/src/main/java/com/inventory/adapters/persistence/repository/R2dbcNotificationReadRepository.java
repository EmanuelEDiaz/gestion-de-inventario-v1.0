package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.NotificationReadEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface R2dbcNotificationReadRepository extends ReactiveCrudRepository<NotificationReadEntity, UUID> {

    @Query("SELECT COUNT(*) > 0 FROM notification_reads WHERE notification_id = :notificationId AND user_id = :userId")
    Mono<Boolean> existsByNotificationIdAndUserId(UUID notificationId, UUID userId);

    @Query("SELECT notification_id FROM notification_reads WHERE user_id = :userId")
    Flux<UUID> findNotificationIdsByUserId(UUID userId);

    @Query("""
        SELECT COUNT(*) FROM notifications n
        WHERE (n.target_user_id = :userId OR n.target_type = 'ALL')
          AND NOT EXISTS (
              SELECT 1 FROM notification_reads nr
              WHERE nr.notification_id = n.id AND nr.user_id = :userId
          )
        """)
    Mono<Long> countUnreadByUserId(UUID userId);

    @Query("DELETE FROM notification_reads WHERE notification_id = :notificationId")
    Mono<Void> deleteByNotificationId(UUID notificationId);
}
