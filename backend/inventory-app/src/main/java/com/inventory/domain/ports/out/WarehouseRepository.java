package com.inventory.domain.ports.out;

import com.inventory.domain.model.Warehouse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida: Repositorio de Almacenes.
 */
public interface WarehouseRepository {
    
    Mono<Warehouse> findById(UUID id);
    
    Mono<Warehouse> findByCode(String code);
    
    Flux<Warehouse> findAll();
    
    Flux<Warehouse> findAllActive();
    
    Mono<Warehouse> save(Warehouse warehouse);
    
    Mono<Boolean> existsByCode(String code);
    
    Mono<Void> deleteById(UUID id);
}
