package com.inventory.domain.ports.out;

import com.inventory.domain.model.Customer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida: Repositorio de Clientes.
 */
public interface CustomerRepository {
    
    Mono<Customer> findById(UUID id);
    
    Mono<Customer> findByCode(String code);
    
    Flux<Customer> findAll();
    
    Flux<Customer> findAllActive();
    
    Flux<Customer> findByActive(boolean active);
    
    Flux<Customer> search(String query);
    
    Mono<Customer> save(Customer customer);
    
    Mono<Boolean> existsByCode(String code);
    
    Mono<Boolean> existsByName(String name);
    
    Mono<Void> deleteById(UUID id);
}
