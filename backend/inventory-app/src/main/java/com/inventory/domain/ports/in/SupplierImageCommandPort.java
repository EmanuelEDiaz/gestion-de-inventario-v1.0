package com.inventory.domain.ports.in;

import com.inventory.domain.model.supplier.SupplierImage;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada para comandos de imágenes de proveedores.
 */
public interface SupplierImageCommandPort {

    Mono<SupplierImage> uploadWithFile(UploadFileCommand command);

    Mono<SupplierImage> upload(UploadCommand command);

    Mono<Void> delete(UUID imageId);

    Mono<SupplierImage> setPrimary(UUID imageId);

    Flux<SupplierImage> listBySupplierId(UUID supplierId);

    record UploadFileCommand(
        UUID supplierId,
        boolean isPrimary,
        byte[] fileData,
        String originalFilename,
        String contentType,
        int sortOrder
    ) {}

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
