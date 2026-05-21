package com.inventory.domain.ports.out;

import com.inventory.domain.model.supplier.SupplierSocialLink;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida: Repositorio de redes sociales de proveedor.
 */
public interface SupplierSocialLinkRepository {

    Flux<SupplierSocialLink> findBySupplierId(UUID supplierId);

    Mono<SupplierSocialLink> findById(UUID id);

    Mono<SupplierSocialLink> save(SupplierSocialLink link);

    Mono<Void> deleteById(UUID id);

    Mono<Void> deleteBySupplierId(UUID supplierId);
}
