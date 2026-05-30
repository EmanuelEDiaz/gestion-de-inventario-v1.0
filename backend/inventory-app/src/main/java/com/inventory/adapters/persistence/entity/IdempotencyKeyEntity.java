package com.inventory.adapters.persistence.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;

/**
 * R2DBC entity for idempotency_keys table (V1+V4 schema).
 *
 * Actual schema (V1):
 *   CREATE TABLE idempotency_keys (
 *     key           VARCHAR(100) PRIMARY KEY,
 *     scope         VARCHAR(50)  NOT NULL,
 *     request_hash  VARCHAR(64),
 *     response_json JSONB,
 *     created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '72 hours'
 *   );
 * V4 adds: status TEXT DEFAULT 'PENDING'
 */
@Table("idempotency_keys")
public class IdempotencyKeyEntity {

    @Id
    @Column("key")
    private String key;

    @Column("scope")
    private String scope;

    @Column("request_hash")
    private String requestHash;

    @Column("response_json")
    private String responseJson;

    @Column("created_at")
    private Instant createdAt;

    @Column("expires_at")
    private Instant expiresAt;

    @Column("status")
    private String status;

    public IdempotencyKeyEntity() {
    }

    public IdempotencyKeyEntity(String key, String scope, String requestHash,
                                String responseJson, Instant createdAt,
                                Instant expiresAt, String status) {
        this.key = key;
        this.scope = scope;
        this.requestHash = requestHash;
        this.responseJson = responseJson;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.status = status;
    }

    public static IdempotencyKeyEntity create(String key, String requestHash, String responseJson) {
        return new IdempotencyKeyEntity(
            key,
            "sync",
            requestHash,
            responseJson,
            Instant.now(),
            Instant.now().plusSeconds(72 * 3600),
            "COMPLETED"
        );
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
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

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
