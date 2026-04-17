package com.inventory.domain.ports.in;

import com.inventory.domain.model.Supplier;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada para comandos de proveedores.
 */
public interface SupplierCommandPort {
    Mono<Supplier> create(CreateCommand command);
    Mono<Supplier> update(UUID id, UpdateCommand command);
    Mono<Void> delete(UUID id);
    Mono<Supplier> activate(UUID id);
    Mono<Supplier> deactivate(UUID id);

    record CreateCommand(
        String code,
        String name,
        String contactName,
        String phone,
        String email,
        String address,
        String notes
    ) {}

    record UpdateCommand(
        String code,
        String name,
        String contactName,
        String phone,
        String email,
        String address,
        String notes
    ) {}
}
