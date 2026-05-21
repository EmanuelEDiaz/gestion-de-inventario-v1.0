package com.inventory.domain.ports.out;

import com.inventory.domain.model.product.ProductImage;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface ProductImageRepository {
    Flux<ProductImage> findByProductId(UUID productId);
    Mono<ProductImage> findById(UUID id);
    Mono<ProductImage> save(ProductImage image);
    Mono<Void> deleteById(UUID imageId);
    Mono<Boolean> existsById(UUID id);
    Mono<Long> countByProductId(UUID productId);
}