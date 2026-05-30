package com.inventory.adapters.persistence.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * R2DBC entity for idempotency_keys table.
 * Each row caches a request's response to prevent duplicate processing.
 *
 * Schema (from V1 or early migration):
 *   CREATE TABLE idempotency_keys (
 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     operation_id VARCHAR(255) UNIQUE NOT NULL,  -- operationId from frontend outbox
 *     request_hash VARCHAR(64) NOT NULL,          -- SHA256 of request payload
 *     response_json TEXT NOT NULL,                -- cached response (JSON)
 *     created_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 */
@Table("idempotency_keys")
public class IdempotencyKeyEntity {
    @Id
    private UUID id;

    @Column("operation_id")
    private String operationId;

    @Column("request_hash")
    private String requestHash;

    @Column("response_json")
    private String responseJson;

    @Column("created_at")
    private Instant createdAt;

    // Constructors
    public IdempotencyKeyEntity() {
    }

    public IdempotencyKeyEntity(UUID id, String operationId, String requestHash, String responseJson, Instant createdAt) {
        this.id = id;
        this.operationId = operationId;
        this.requestHash = requestHash;
        this.responseJson = responseJson;
        this.createdAt = createdAt;
    }

    public static IdempotencyKeyEntity create(String operationId, String requestHash, String responseJson) {
        return new IdempotencyKeyEntity(
            UUID.randomUUID(),
            operationId,
            requestHash,
            responseJson,
            Instant.now()
        );
    }

    // Getters / Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getOperationId() {
        return operationId;
    }

    public void setOperationId(String operationId) {
        this.operationId = operationId;
    }

    public String getRequestHash() {
        return requestHash;
    }

    public void setRequestHash(String requestHash) {
        this.requestHash = requestHash;
    }

    public String getResponseJson() {
        return responseJson;
    }

    public void setResponseJson(String responseJson) {
        this.responseJson = responseJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        IdempotencyKeyEntity that = (IdempotencyKeyEntity) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "IdempotencyKeyEntity{" +
                "id=" + id +
                ", operationId='" + operationId + '\'' +
                ", requestHash='" + requestHash + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}
