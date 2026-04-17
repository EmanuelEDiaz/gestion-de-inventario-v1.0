package com.inventory.application.usecase.query;

import com.inventory.domain.model.Product;
import com.inventory.domain.ports.in.ProductQueryPort;
import com.inventory.domain.ports.out.ProductRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: Consultas de Productos.
 */
@Service
public class ProductQueryUseCase implements ProductQueryPort {

    private final ProductRepository productRepository;

    public ProductQueryUseCase(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public Mono<Product> findById(UUID id) {
        return productRepository.findById(id);
    }

    @Override
    public Mono<Product> findBySku(String sku) {
        return productRepository.findBySku(sku);
    }

    @Override
    public Mono<Product> findByBarcode(String barcode) {
        return productRepository.findByBarcode(barcode);
    }

    @Override
    public Flux<Product> findAll(int page, int size, boolean activeOnly) {
        if (activeOnly) {
            return productRepository.findAllActive();
        }
        return productRepository.findAllPaginated(page, size);
    }

    @Override
    public Flux<Product> findByCategory(UUID categoryId) {
        return productRepository.findByCategory(categoryId);
    }

    @Override
    public Flux<Product> search(String query) {
        return productRepository.search(query);
    }

    @Override
    public Mono<Long> count() {
        return productRepository.count();
    }

    @Override
    public Mono<Long> countByStatus(Product.ProductStatus status) {
        return productRepository.countByStatus(status);
    }
}
