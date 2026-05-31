package com.inventory.application.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class AuditLogRetentionService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogRetentionService.class);

    private final SystemSettingsService settings;
    private final DatabaseClient db;

    public AuditLogRetentionService(SystemSettingsService settings, DatabaseClient db) {
        this.settings = settings;
        this.db = db;
    }

    @Scheduled(cron = "0 0 3 * * 0")
    public void archiveOldLogs() {
        settings.getInt("audit.retention-days-hot", 90)
            .flatMap(days -> archiveInBatches(Instant.now().minus(days, ChronoUnit.DAYS)))
            .subscribe();
    }

    private Mono<Void> archiveInBatches(Instant cutoff) {
        return Mono.just(1L)
            .expand(__ -> archiveBatch(cutoff))
            .takeWhile(rows -> rows > 0L)
            .then();
    }

    @Scheduled(cron = "0 0 4 * * 0")
    public void deleteOldArchive() {
        settings.getInt("audit.retention-days-archive", 365)
            .flatMap(days -> deleteArchiveInBatches(Instant.now().minus(days, ChronoUnit.DAYS)))
            .subscribe();
    }

    private Mono<Long> archiveBatch(Instant cutoff) {
        return db.sql("""
            WITH deleted AS (
                DELETE FROM audit_log
                WHERE id IN (
                    SELECT id FROM audit_log
                    WHERE created_at < $1
                    LIMIT 10000
                )
                RETURNING *
            )
            INSERT INTO audit_log_archive SELECT * FROM deleted
            """)
            .bind(0, cutoff)
            .fetch()
            .rowsUpdated()
            .onErrorResume(e -> {
                log.error("Batch archive falló en cutoff={}", cutoff, e);
                return Mono.just(0L);
            });
    }

    private Mono<Void> deleteArchiveInBatches(Instant cutoff) {
        return Mono.just(1L)
            .expand(__ -> deleteArchiveBatch(cutoff))
            .takeWhile(rows -> rows > 0L)
            .then();
    }

    private Mono<Long> deleteArchiveBatch(Instant cutoff) {
        return db.sql("""
            DELETE FROM audit_log_archive
            WHERE id IN (
                SELECT id FROM audit_log_archive
                WHERE created_at < $1
                LIMIT 10000
            )
            """)
            .bind(0, cutoff)
            .fetch()
            .rowsUpdated()
            .onErrorResume(e -> {
                log.error("Batch delete archive falló en cutoff={}", cutoff, e);
                return Mono.just(0L);
            });
    }
}
