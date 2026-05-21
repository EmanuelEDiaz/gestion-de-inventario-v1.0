package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.ReturnEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Repositorio R2DBC para devoluciones.
 */
public interface R2dbcReturnRepository extends ReactiveCrudRepository<ReturnEntity, UUID> {

    Flux<ReturnEntity> findByWarehouseId(UUID warehouseId);
    Flux<ReturnEntity> findByType(String type);
    Flux<ReturnEntity> findByStatus(String status);
    Flux<ReturnEntity> findByReturnDateBetween(LocalDate from, LocalDate to);

    @Query("SELECT nextval('sale_return_number_seq')")
    Mono<Long> getNextSaleReturnNumber();

    @Query("SELECT nextval('purchase_return_number_seq')")
    Mono<Long> getNextPurchaseReturnNumber();
}
