package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.RefreshTokenEntity;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Repositorio R2DBC para refresh tokens.
 */
@Repository
public interface RefreshTokenR2dbcRepository extends R2dbcRepository<RefreshTokenEntity, UUID> {
    
    @Query("SELECT * FROM refresh_tokens WHERE token_hash = :tokenHash AND revoked_at IS NULL")
    Mono<RefreshTokenEntity> findByTokenHash(String tokenHash);
    
    @Modifying
    @Query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = :tokenId AND revoked_at IS NULL")
    Mono<Void> revokeById(UUID tokenId);
    
    @Modifying
    @Query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = :userId AND revoked_at IS NULL")
    Mono<Void> revokeAllByUserId(UUID userId);
    
    @Modifying
    @Query("DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked_at IS NOT NULL")
    Mono<Long> deleteExpired();
}
