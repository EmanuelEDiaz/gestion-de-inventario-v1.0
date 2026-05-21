package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.PurchaseLineEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public interface R2dbcPurchaseLineRepository extends ReactiveCrudRepository<PurchaseLineEntity, UUID> {

    Flux<PurchaseLineEntity> findByPurchaseIdOrderBySortOrder(UUID purchaseId);

    Mono<Void> deleteByPurchaseId(UUID purchaseId);
}
