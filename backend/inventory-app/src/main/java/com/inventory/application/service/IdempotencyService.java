package com.inventory.application.service;

import com.inventory.domain.ports.out.IdempotencyRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class IdempotencyService {

    private final IdempotencyRepository idempotencyRepository;

    public IdempotencyService(IdempotencyRepository idempotencyRepository) {
        this.idempotencyRepository = idempotencyRepository;
    }

    public Mono<Boolean> checkAndStore(String operationId, String requestHash, String responseJson) {
        return idempotencyRepository.existsByKey(operationId)
            .flatMap(exists -> {
                if (exists) return Mono.just(false);
                return idempotencyRepository.store(operationId, requestHash, responseJson)
                    .thenReturn(true);
            });
    }

    public Mono<String> getCachedResponse(String operationId) {
        return idempotencyRepository.getCachedResponse(operationId);
    }

    public Mono<String> findRealIdByTempId(String tempEntityId) {
        return idempotencyRepository.findRealIdByTempId(tempEntityId);
    }

    public Mono<Void> deleteOlderThan(java.time.Instant before) {
        return idempotencyRepository.deleteOlderThan(before);
    }
}
