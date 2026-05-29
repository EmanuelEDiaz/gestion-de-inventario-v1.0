package com.inventory.domain.ports.out;

import java.time.Instant;
import java.util.UUID;

public record AuditLogSearchCriteria(
    String entityType,
    UUID actorId,
    String action,
    Instant fromDate,
    Instant toDate,
    int page,
    int size
) {}
