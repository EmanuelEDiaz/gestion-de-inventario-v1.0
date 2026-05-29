package com.inventory.domain.ports.in.customer;

import com.inventory.domain.model.customer.Customer;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

/**
 * Puerto de entrada para comandos de clientes.
 */
public interface CustomerCommandPort {
    Mono<Customer> create(CreateCommand command, UUID userId);
    Mono<Customer> update(UUID id, UpdateCommand command, UUID userId);
    Mono<Void> delete(UUID id, UUID userId);
    Mono<Void> deleteAll(List<UUID> ids);
    Mono<Customer> activate(UUID id, UUID userId);
    Mono<Customer> deactivate(UUID id, UUID userId);

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
