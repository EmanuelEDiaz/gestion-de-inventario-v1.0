package com.inventory.application.service;

import com.inventory.adapters.persistence.adapter.repository.R2dbcSyncLogRepository;
import com.inventory.domain.ports.out.IdempotencyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class SyncLogRetentionService {

    private static final Logger log = LoggerFactory.getLogger(SyncLogRetentionService.class);

    private final SystemSettingsService settings;
    private final R2dbcSyncLogRepository syncLogRepo;
    private final IdempotencyRepository idempotencyRepository;

    public SyncLogRetentionService(
        SystemSettingsService settings,
        R2dbcSyncLogRepository syncLogRepo,
        IdempotencyRepository idempotencyRepository
    ) {
        this.settings = settings;
        this.syncLogRepo = syncLogRepo;
        this.idempotencyRepository = idempotencyRepository;
    }

    @Scheduled(cron = "0 2 * * *")
    public void cleanupSyncLog() {
        settings.getInt("sync.retention-days", 30)
            .flatMap(days ->
                syncLogRepo.deleteOlderThanDate(Instant.now().minus(days, ChronoUnit.DAYS))
            )
            .doOnSuccess(ignore -> log.info("Limpiadas entradas de sync_log con más de {} días", 30))
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
}
