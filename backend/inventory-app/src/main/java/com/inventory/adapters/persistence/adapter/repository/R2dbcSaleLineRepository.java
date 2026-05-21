package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.SaleLineEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface R2dbcSaleLineRepository extends ReactiveCrudRepository<SaleLineEntity, UUID> {

    Flux<SaleLineEntity> findBySaleIdOrderBySortOrder(UUID saleId);

    Mono<Void> deleteBySaleId(UUID saleId);
}
