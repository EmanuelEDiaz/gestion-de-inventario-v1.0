package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.mapper.PersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.RefreshTokenR2dbcRepository;
import com.inventory.domain.model.user.RefreshToken;
import com.inventory.domain.ports.out.RefreshTokenRepositoryPort;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Adaptador de persistencia para refresh tokens.
 * Implementa el puerto de salida del dominio.
 */
@Component
public class RefreshTokenRepositoryAdapter implements RefreshTokenRepositoryPort {
    
    private final RefreshTokenR2dbcRepository repository;
    private final PersistenceMapper mapper;
    
    public RefreshTokenRepositoryAdapter(RefreshTokenR2dbcRepository repository,
                                          PersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }
    
    @Override
    public Mono<RefreshToken> findByTokenHash(String tokenHash) {
        return repository.findByTokenHash(tokenHash)
                .map(mapper::toDomain);
    }
    
    @Override
    public Mono<RefreshToken> save(RefreshToken token) {
        return repository.save(mapper.toEntity(token))
                .map(mapper::toDomain);
    }
    
    @Override
    public Mono<Void> revoke(UUID tokenId) {
        return repository.revokeById(tokenId);
    }
    
    @Override
    public Mono<Void> revokeAllByUserId(UUID userId) {
        return repository.revokeAllByUserId(userId);
    }
    
    @Override
    public Mono<Long> deleteExpired() {
        return repository.deleteExpired();
    }
}
