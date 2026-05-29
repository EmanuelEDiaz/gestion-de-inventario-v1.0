package com.inventory.domain.model.importjob;

import java.time.Instant;
import java.util.UUID;

public class ImportJob {

    private final UUID id;
    private final String type;
    private final ImportStatus status;
    private final String originalFilename;
    private final String mappingJson;
    private final String resultJson;
    private final String errorMessage;
    private final UUID createdBy;
    private final Instant createdAt;
    private final Instant updatedAt;

    public ImportJob(UUID id, String type, ImportStatus status, String originalFilename,
                     String mappingJson, String resultJson, String errorMessage,
                     UUID createdBy, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.type = type;
        this.status = status;
        this.originalFilename = originalFilename;
        this.mappingJson = mappingJson;
        this.resultJson = resultJson;
        this.errorMessage = errorMessage;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static ImportJob create(String type, String originalFilename, String mappingJson, UUID createdBy) {
        return new ImportJob(
            UUID.randomUUID(),
            type,
            ImportStatus.PENDING,
            originalFilename,
            mappingJson,
            null,
            null,
            createdBy,
            Instant.now(),
            Instant.now()
        );
    }

    public ImportJob withStatus(ImportStatus newStatus) {
        return new ImportJob(id, type, newStatus, originalFilename, mappingJson,
            resultJson, errorMessage, createdBy, createdAt, Instant.now());
    }

    public ImportJob withResult(String resultJson) {
        return new ImportJob(id, type, ImportStatus.COMPLETED, originalFilename, mappingJson,
            resultJson, null, createdBy, createdAt, Instant.now());
    }

    public ImportJob withError(String errorMessage) {
        return new ImportJob(id, type, ImportStatus.FAILED, originalFilename, mappingJson,
            null, errorMessage, createdBy, createdAt, Instant.now());
    }

    public UUID getId() { return id; }
    public String getType() { return type; }
    public ImportStatus getStatus() { return status; }
    public String getOriginalFilename() { return originalFilename; }
    public String getMappingJson() { return mappingJson; }
    public String getResultJson() { return resultJson; }
    public String getErrorMessage() { return errorMessage; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
