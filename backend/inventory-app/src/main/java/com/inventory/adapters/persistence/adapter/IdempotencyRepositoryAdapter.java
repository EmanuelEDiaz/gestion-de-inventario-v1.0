package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.entity.IdempotencyKeyEntity;
import com.inventory.adapters.persistence.mapper.IdempotencyMapper;
import com.inventory.adapters.persistence.repository.SpringDataIdempotencyRepository;
import com.inventory.domain.ports.out.IdempotencyRepository;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Component
public class IdempotencyRepositoryAdapter implements IdempotencyRepository {
    private final SpringDataIdempotencyRepository springRepo;
    private final IdempotencyMapper mapper;

    public IdempotencyRepositoryAdapter(
        SpringDataIdempotencyRepository springRepo,
        IdempotencyMapper mapper
    ) {
        this.springRepo = springRepo;
        this.mapper = mapper;
    }

    @Override
    public Mono<Boolean> existsByKey(String key) {
        return springRepo.findByOperationId(key)
            .map(entity -> true)
            .defaultIfEmpty(false);
    }

    @Override
    public Mono<Void> store(String key, String requestHash, String responseJson) {
        var entity = IdempotencyKeyEntity.create(key, requestHash, responseJson);
        return springRepo.save(entity).then();
    }

    @Override
    public Mono<String> getCachedResponse(String key) {
        return springRepo.findByOperationId(key)
            .map(IdempotencyKeyEntity::getResponseJson);
    }

    @Override
    public Mono<Void> deleteOlderThan(Instant before) {
        return springRepo.deleteOlderThan(before);
    }
}
