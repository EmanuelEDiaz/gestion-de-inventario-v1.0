package com.inventory.domain.ports.in.supplier;

import com.inventory.domain.model.supplier.Supplier;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

/**
 * Puerto de entrada para comandos de proveedores.
 */
public interface SupplierCommandPort {
    Mono<Supplier> create(CreateCommand command, UUID userId);
    Mono<Supplier> update(UUID id, UpdateCommand command, UUID userId);
    Mono<Void> delete(UUID id, UUID userId);
    Mono<Void> deleteAll(List<UUID> ids);
    Mono<Supplier> activate(UUID id, UUID userId);
    Mono<Supplier> deactivate(UUID id, UUID userId);

    record CreateCommand(
        String code,
        String name,
        String contactName,
        String phone,
        String email,
        String address,
        String notes,
        String website
    ) {}

    record UpdateCommand(
        String code,
        String name,
        String contactName,
        String phone,
        String email,
        String address,
        String notes,
        String website
    ) {}
}
