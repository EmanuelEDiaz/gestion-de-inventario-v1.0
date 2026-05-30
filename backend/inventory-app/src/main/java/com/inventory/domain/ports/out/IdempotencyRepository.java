package com.inventory.domain.ports.out;

import reactor.core.publisher.Mono;

/**
 * Port for idempotency key management.
 * Prevents duplicate processing of the same request.
 */
public interface IdempotencyRepository {
    Mono<Boolean> existsByKey(String key);
    Mono<Void> store(String key, String requestHash, String responseJson);
    Mono<String> getCachedResponse(String key);
    Mono<String> findRealIdByTempId(String tempEntityId);
    Mono<Void> deleteOlderThan(java.time.Instant before); // limpieza TTL
}