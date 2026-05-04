package com.inventory.domain.ports.in;

import com.inventory.domain.model.SupplierSocialLink;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada para comandos de redes sociales de proveedores.
 */
public interface SupplierSocialLinkCommandPort {

    Mono<SupplierSocialLink> add(AddCommand command);

    Mono<Void> delete(UUID linkId);

    Flux<SupplierSocialLink> listBySupplierId(UUID supplierId);

    record AddCommand(
        UUID supplierId,
        SupplierSocialLink.Platform platform,
        String url,
        String label,
        int sortOrder
    ) {}
}
