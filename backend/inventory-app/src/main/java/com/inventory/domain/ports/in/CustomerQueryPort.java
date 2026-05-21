package com.inventory.domain.ports.in;

import com.inventory.domain.model.customer.Customer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada para consultas de clientes.
 */
public interface CustomerQueryPort {
    Mono<Customer> findById(UUID id);
    Flux<Customer> findAll();
    Flux<Customer> findByActive(boolean active);
    Mono<Customer> findByCode(String code);
    Flux<Customer> search(String query);
}
