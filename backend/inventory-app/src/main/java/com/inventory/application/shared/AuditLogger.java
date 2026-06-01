package com.inventory.application.shared;

import com.inventory.domain.model.audit.AuditLog;
import com.inventory.domain.ports.out.AuditLogRepository;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
public class AuditLogger {

    private final AuditLogRepository auditLogRepository;

    public AuditLogger(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public Mono<Void> log(UUID actorId, String entityType, UUID entityId,
                          String action, String beforeData, String afterData) {
        return RequestIpExtractor.getIp()
            .defaultIfEmpty("")
            .flatMap(ip -> {
                AuditLog auditLog = AuditLog.create(actorId, entityType, entityId, action, beforeData, afterData, ip);
                return auditLogRepository.save(auditLog);
            });
    }
}
