package com.inventory.adapters.persistence.adapter.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad R2DBC para refresh tokens.
 */
@Table("refresh_tokens")
public class RefreshTokenEntity implements Persistable<UUID> {
    
    @Id
    private UUID id;
    
    @Column("user_id")
    private UUID userId;
    
    @Column("token_hash")
    private String tokenHash;
    
    @Column("expires_at")
    private Instant expiresAt;
    
    @Column("revoked_at")
    private Instant revokedAt;
    
    @Column("created_at")
    private Instant createdAt;
    
    @Transient
    private boolean isNew = true;
    
    public RefreshTokenEntity() {}
    
    public RefreshTokenEntity(UUID id, UUID userId, String tokenHash, Instant expiresAt, 
                               Instant revokedAt, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.revokedAt = revokedAt;
        this.createdAt = createdAt;
    }
    
    public static RefreshTokenEntity createNew(UUID id, UUID userId, String tokenHash, 
                                                Instant expiresAt, Instant createdAt) {
        RefreshTokenEntity entity = new RefreshTokenEntity(id, userId, tokenHash, expiresAt, null, createdAt);
        entity.isNew = true;
        return entity;
    }
    
    @Override
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    @Override
    @Transient
    public boolean isNew() { return isNew; }
    public void setNew(boolean isNew) { this.isNew = isNew; }
    
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    
    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
    
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    
    public Instant getRevokedAt() { return revokedAt; }
    public void setRevokedAt(Instant revokedAt) { this.revokedAt = revokedAt; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
