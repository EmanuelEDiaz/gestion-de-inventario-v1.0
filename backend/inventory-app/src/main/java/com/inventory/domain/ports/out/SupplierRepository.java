package com.inventory.domain.ports.out;

import com.inventory.domain.model.Supplier;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida: Repositorio de Proveedores.
 */
public interface SupplierRepository {
    
    Mono<Supplier> findById(UUID id);
    
    Mono<Supplier> findByCode(String code);
    
    Flux<Supplier> findAll();
    
    Flux<Supplier> findAllActive();
    
    Flux<Supplier> findByActive(boolean active);
    
    Flux<Supplier> search(String query);
    
    Mono<Supplier> save(Supplier supplier);
    
    Mono<Boolean> existsByCode(String code);
    
    Mono<Boolean> existsByName(String name);
    
    Mono<Void> deleteById(UUID id);
}
