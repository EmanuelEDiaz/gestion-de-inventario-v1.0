package com.inventory.domain.model.user;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Representa un token de refresco para mantener sesión.
 * Inmutable - dominio puro sin dependencias de framework.
 */
public final class RefreshToken {
    
    private final UUID id;
    private final UUID userId;
    private final String tokenHash;
    private final Instant expiresAt;
    private final Instant revokedAt;
    private final Instant createdAt;
    
    public RefreshToken(UUID id, UUID userId, String tokenHash, Instant expiresAt, 
                        Instant revokedAt, Instant createdAt) {
        this.id = id;
        this.userId = Objects.requireNonNull(userId, "userId cannot be null");
        this.tokenHash = Objects.requireNonNull(tokenHash, "tokenHash cannot be null");
        this.expiresAt = Objects.requireNonNull(expiresAt, "expiresAt cannot be null");
        this.revokedAt = revokedAt;
        this.createdAt = createdAt;
    }
    
    /**
     * Crea un nuevo refresh token.
     */
    public static RefreshToken create(UUID userId, String tokenHash, Instant expiresAt) {
        return new RefreshToken(
                UUID.randomUUID(),
                userId,
                tokenHash,
                expiresAt,
                null,
                Instant.now()
        );
    }
    
    /**
     * Verifica si el token ha expirado.
     */
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
    
    /**
     * Verifica si el token está revocado.
     */
    public boolean isRevoked() {
        return revokedAt != null;
    }
    
    /**
     * Verifica si el token es válido (no revocado y no expirado).
     */
    public boolean isValid() {
        return !isRevoked() && !isExpired();
    }
    
    /**
     * Crea una copia revocada del token.
     */
    public RefreshToken revoke() {
        return new RefreshToken(id, userId, tokenHash, expiresAt, Instant.now(), createdAt);
    }
    
    public UUID getId() {
        return id;
    }
    
    public UUID getUserId() {
        return userId;
    }
    
    public String getTokenHash() {
        return tokenHash;
    }
    
    public Instant getExpiresAt() {
        return expiresAt;
    }
    
    public Instant getRevokedAt() {
        return revokedAt;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RefreshToken that = (RefreshToken) o;
        return Objects.equals(id, that.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return "RefreshToken{id=" + id + ", userId=" + userId + ", expires=" + expiresAt + ", revoked=" + isRevoked() + "}";
    }
}
