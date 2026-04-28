package com.inventory.domain.ports.in;

import com.inventory.domain.model.SupplierImage;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada para comandos de imágenes de proveedores.
 */
public interface SupplierImageCommandPort {

    Mono<SupplierImage> upload(UploadCommand command);

    Mono<Void> delete(UUID imageId);

    Mono<SupplierImage> setPrimary(UUID imageId);

    record UploadCommand(
        UUID supplierId,
        boolean isPrimary,
        String contentType,
        String filePath,
        String originalFilename,
        long sizeBytes,
        int sortOrder
    ) {}
}
