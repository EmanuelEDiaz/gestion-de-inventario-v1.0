package com.inventory.domain.ports.in.customer;

import com.inventory.domain.model.customer.Customer;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada para comandos de clientes.
 */
public interface CustomerCommandPort {
    Mono<Customer> create(CreateCommand command);
    Mono<Customer> update(UUID id, UpdateCommand command);
    Mono<Void> delete(UUID id);
    Mono<Customer> activate(UUID id);
    Mono<Customer> deactivate(UUID id);

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
