package com.inventory.domain.ports.in;

import com.inventory.domain.model.warehouse.Warehouse;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada: Comandos de Almacenes.
 */
public interface WarehouseCommandPort {

    Mono<Warehouse> create(CreateWarehouseCommand command);

    Mono<Warehouse> update(UUID id, UpdateWarehouseCommand command);

    Mono<Warehouse> activate(UUID id);

    Mono<Warehouse> deactivate(UUID id);

    // ===== Command Records =====

    record CreateWarehouseCommand(
        String code,
        String name,
        String address
    ) {}

    record UpdateWarehouseCommand(
        String name,
        String address
    ) {}
}
