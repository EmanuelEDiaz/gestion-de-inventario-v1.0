package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.entity.DeviceCursorEntity;
import com.inventory.adapters.persistence.repository.SpringDataDeviceCursorRepository;
import com.inventory.domain.ports.out.DeviceCursorRepository;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Component
public class DeviceCursorRepositoryAdapter implements DeviceCursorRepository {
    private final SpringDataDeviceCursorRepository springRepo;

    public DeviceCursorRepositoryAdapter(SpringDataDeviceCursorRepository springRepo) {
        this.springRepo = springRepo;
    }

    /**
     * Update the last cursor seen by a device.
     * Called after each GET /sync/pull to track progress.
     */
    public Mono<Void> updateLastCursor(UUID deviceId, UUID userId, Long cursor, String userAgent) {
        return springRepo.findById(deviceId)
            .flatMap(entity -> {
                entity.setLastCursor(cursor);
                entity.setLastSeenAt(Instant.now());
                return springRepo.save(entity).then();
            })
            .switchIfEmpty(
                springRepo.save(DeviceCursorEntity.create(deviceId, userId, userAgent)).then()
            );
    }

    /**
     * Get the minimum cursor among active devices (last seen within 7 days).
     * Used by SyncLogRetentionService to determine what sync_log entries can be deleted.
     */
    public Mono<Long> getMinActiveCursor() {
        var sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        return springRepo.findMinActiveCursor(sevenDaysAgo)
            .defaultIfEmpty(0L);
    }

    @Override
    public Mono<DeviceCursorEntity> findByDeviceId(UUID deviceId) {
        return springRepo.findById(deviceId);
    }

    @Override
    public Mono<Void> save(DeviceCursorEntity entity) {
        return springRepo.save(entity).then();
    }

    @Override
    public Mono<Void> updateCursor(UUID deviceId, long cursor) {
        return springRepo.findById(deviceId)
            .flatMap(entity -> {
                entity.setLastCursor(cursor);
                entity.setLastSeenAt(Instant.now());
                return springRepo.save(entity).then();
            });
    }
}
