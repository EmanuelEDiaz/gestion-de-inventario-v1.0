package com.inventory.domain.ports.in;

import com.inventory.domain.model.Return;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Puerto de entrada para consultas de devoluciones.
 */
public interface ReturnQueryPort {
    
    Mono<Return> findById(UUID id);
    Flux<Return> findAll();
    Flux<Return> findByWarehouse(UUID warehouseId);
    Flux<Return> findByType(Return.ReturnType type);
    Flux<Return> findByStatus(Return.ReturnStatus status);
    Flux<Return> findByDateRange(LocalDate from, LocalDate to);
}
