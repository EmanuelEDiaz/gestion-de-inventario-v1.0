package com.inventory.domain.ports.in;

import com.inventory.domain.model.warehouse.Warehouse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada: Consultas de Almacenes.
 */
public interface WarehouseQueryPort {

    Mono<Warehouse> findById(UUID id);

    Mono<Warehouse> findByCode(String code);

    Flux<Warehouse> findAll(boolean activeOnly);
}
