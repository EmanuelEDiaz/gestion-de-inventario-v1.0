package com.inventory.domain.ports.in;

import com.inventory.domain.model.supplier.Supplier;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada para consultas de proveedores.
 */
public interface SupplierQueryPort {
    Mono<Supplier> findById(UUID id);
    Flux<Supplier> findAll();
    Flux<Supplier> findByActive(boolean active);
    Mono<Supplier> findByCode(String code);
    Flux<Supplier> search(String query);
}
