package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.ReturnLineEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Repositorio R2DBC para líneas de devolución.
 */
public interface R2dbcReturnLineRepository extends ReactiveCrudRepository<ReturnLineEntity, UUID> {

    Flux<ReturnLineEntity> findByReturnIdOrderBySortOrder(UUID returnId);
    Mono<Void> deleteByReturnId(UUID returnId);
}
