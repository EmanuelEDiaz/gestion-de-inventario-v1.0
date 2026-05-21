package com.inventory.domain.ports.in.product;

import com.inventory.domain.model.product.ProductImage;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface ProductImageCommandPort {
    Mono<ProductImage> uploadWithFile(UploadFileCommand command);
    Mono<ProductImage> upload(UploadCommand command);
    Mono<Void> delete(UUID imageId);
    Mono<ProductImage> setPrimary(UUID imageId);
    Flux<ProductImage> listByProduct(UUID productId);
    Mono<Long> countByProductId(UUID productId);

    record UploadFileCommand(
        UUID productId,
        byte[] fileData,
        String originalFilename,
        String contentType,
        boolean isPrimary
    ) {}

    record UploadCommand(
        UUID productId,
        boolean isPrimary,
        String contentType,
        String filePath,
        String originalFilename,
        long sizeBytes,
        int sortOrder
    ) {}
}