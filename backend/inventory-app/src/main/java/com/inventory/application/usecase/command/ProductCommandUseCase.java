package com.inventory.application.usecase.command;

import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.errors.ConflictException;
import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.product.Product;
import com.inventory.domain.ports.in.ProductCommandPort;
import com.inventory.domain.ports.out.CategoryRepository;
import com.inventory.domain.ports.out.ProductRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

/**
 * Caso de uso: Comandos de Productos.
 */
@Service
public class ProductCommandUseCase implements ProductCommandPort {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductCommandUseCase(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public Mono<Product> create(CreateProductCommand command) {
        return validateUniqueConstraints(command.sku(), command.barcode(), null)
            .then(validateCategory(command.categoryId()))
            .then(Mono.defer(() -> {
                Product product = new Product(
                    UUID.randomUUID(),
                    command.sku(),
                    command.barcode(),
                    command.name(),
                    command.description(),
                    command.categoryId(),
                    Product.ProductStatus.ACTIVE,
                    Product.CostMethod.INHERIT,
                    command.standardCost(),
                    command.salePrice(),
                    command.reorderPoint(),
                    "CUP",
                    command.taxRate(),
                    command.unitOfMeasure(),
                    Instant.now(),
                    Instant.now(),
                    0,
                    null
                );
                return productRepository.save(product);
            }));
    }

    @Override
    public Mono<Product> update(UUID id, UpdateProductCommand command) {
        return productRepository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Producto", id.toString())))
            .flatMap(existing -> validateUniqueConstraints(command.sku(), command.barcode(), id)
                .then(validateCategoryIfPresent(command.categoryId()))
                .thenReturn(existing))
            .map(existing -> {
                Product updated = existing
                    .updateBasicInfo(command.name(), command.description(), command.sku(), command.barcode())
                    .updatePricing(command.standardCost(), command.salePrice(), command.taxRate());
                
                if (command.categoryId() != null) {
                    updated = updated.updateCategory(command.categoryId());
                }
                if (command.costMethod() != null) {
                    updated = updated.updateCostMethod(command.costMethod());
                }
                if (command.reorderPoint() != null) {
                    updated = updated.setReorderPoint(command.reorderPoint());
                }
                return updated;
            })
            .flatMap(productRepository::save);
    }

    @Override
    public Mono<Product> archive(UUID id) {
        return productRepository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Producto", id.toString())))
            .map(Product::archive)
            .flatMap(productRepository::save);
    }

    @Override
    public Mono<Product> activate(UUID id) {
        return productRepository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Producto", id.toString())))
            .map(Product::activate)
            .flatMap(productRepository::save);
    }

    @Override
    public Mono<Void> delete(UUID id) {
        return productRepository.existsById(id)
            .flatMap(exists -> exists 
                ? productRepository.deleteById(id)
                : Mono.error(new NotFoundException("Producto", id.toString())));
    }

    private Mono<Void> validateUniqueConstraints(String sku, String barcode, UUID excludeId) {
        Mono<Void> skuCheck = sku != null && !sku.isBlank()
            ? productRepository.findBySku(sku)
                .filter(p -> excludeId == null || !p.getId().equals(excludeId))
                .flatMap(p -> Mono.<Void>error(new ConflictException("SKU", sku)))
                .then()
            : Mono.empty();

        Mono<Void> barcodeCheck = barcode != null && !barcode.isBlank()
            ? productRepository.findByBarcode(barcode)
                .filter(p -> excludeId == null || !p.getId().equals(excludeId))
                .flatMap(p -> Mono.<Void>error(new ConflictException("Código de barras", barcode)))
                .then()
            : Mono.empty();

        return skuCheck.then(barcodeCheck);
    }

    private Mono<Void> validateCategory(UUID categoryId) {
        if (categoryId == null) return Mono.empty();
        return categoryRepository.findById(categoryId)
            .switchIfEmpty(Mono.error(new BadRequestException("Categoría no encontrada")))
            .then();
    }

    private Mono<Void> validateCategoryIfPresent(UUID categoryId) {
        if (categoryId == null) return Mono.empty();
        return validateCategory(categoryId);
    }
}
