package com.inventory.domain.ports.in;

import com.inventory.domain.model.customer.CustomerImage;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada para comandos de imágenes de clientes.
 */
public interface CustomerImageCommandPort {

    Mono<CustomerImage> uploadWithFile(UploadFileCommand command);

    Mono<CustomerImage> upload(UploadCommand command);

    Mono<Void> delete(UUID imageId);

    Mono<CustomerImage> setPrimary(UUID imageId);

    Flux<CustomerImage> listByCustomer(UUID customerId);

    record UploadFileCommand(
        UUID customerId,
        boolean isPrimary,
        byte[] fileData,
        String originalFilename,
        String contentType,
        int sortOrder
    ) {}

    record UploadCommand(
        UUID customerId,
        boolean isPrimary,
        String contentType,
        String filePath,
        String originalFilename,
        long sizeBytes,
        int sortOrder
    ) {}
}
