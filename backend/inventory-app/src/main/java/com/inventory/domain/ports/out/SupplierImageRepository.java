package com.inventory.domain.ports.out;

import com.inventory.domain.model.SupplierImage;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida: Repositorio de imágenes de proveedor.
 */
public interface SupplierImageRepository {

    Flux<SupplierImage> findBySupplierId(UUID supplierId);

    Mono<SupplierImage> findById(UUID id);

    Mono<SupplierImage> save(SupplierImage image);

    Mono<Void> deleteById(UUID id);

    Mono<Void> deleteBySupplierId(UUID supplierId);

    Mono<Boolean> existsById(UUID id);
}
