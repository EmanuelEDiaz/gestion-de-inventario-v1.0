package com.inventory.domain.ports.out;

import com.inventory.domain.model.CustomerImage;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida: Repositorio de imágenes de cliente.
 */
public interface CustomerImageRepository {

    Flux<CustomerImage> findByCustomerId(UUID customerId);

    Mono<CustomerImage> findById(UUID id);

    Mono<CustomerImage> save(CustomerImage image);

    Mono<Void> deleteById(UUID id);

    Mono<Void> deleteByCustomerId(UUID customerId);

    Mono<Boolean> existsById(UUID id);
}
