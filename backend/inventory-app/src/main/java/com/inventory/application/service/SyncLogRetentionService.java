package com.inventory.application.service;

import com.inventory.domain.ports.out.IdempotencyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class SyncLogRetentionService {

    private static final Logger log = LoggerFactory.getLogger(SyncLogRetentionService.class);

    private final SystemSettingsService settings;
    private final DatabaseClient db;
    private final IdempotencyRepository idempotencyRepository;

    public SyncLogRetentionService(
        SystemSettingsService settings,
        DatabaseClient db,
        IdempotencyRepository idempotencyRepository
    ) {
        this.settings = settings;
        this.db = db;
        this.idempotencyRepository = idempotencyRepository;
    }

    @Scheduled(cron = "0 2 * * *")
    public void cleanupSyncLog() {
        settings.getInt("sync.retention-days", 30)
            .flatMap(days -> deleteInBatches(Instant.now().minus(days, ChronoUnit.DAYS)))
            .doOnError(e -> log.error("Error limpiando sync_log", e))
            .subscribe();
    }

    @Scheduled(cron = "0 3 * * *")
    public void cleanupIdempotencyKeys() {
        idempotencyRepository.deleteOlderThan(Instant.now().minus(2, ChronoUnit.DAYS))
            .doOnSuccess(ignore -> log.info("Limpiadas claves de idempotencia con más de 2 días"))
            .doOnError(e -> log.error("Error limpiando idempotency_keys", e))
            .subscribe();
    }

    private Mono<Void> deleteInBatches(Instant cutoff) {
        return Mono.just(1L)
            .expand(__ -> deleteBatch(cutoff))
            .takeWhile(rows -> rows > 0L)
            .then();
    }

    private Mono<Long> deleteBatch(Instant cutoff) {
        return db.sql("DELETE FROM sync_log WHERE created_at < $1 LIMIT 10000")
            .bind(0, cutoff)
            .fetch()
            .rowsUpdated()
            .onErrorResume(e -> {
                log.error("Batch delete sync_log falló en cutoff={}", cutoff, e);
                return Mono.just(0L);
            });
    }
}
