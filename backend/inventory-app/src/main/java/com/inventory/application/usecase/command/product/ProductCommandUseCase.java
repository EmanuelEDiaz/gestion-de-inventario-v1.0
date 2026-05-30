package com.inventory.application.usecase.command.product;

import com.inventory.application.shared.AuditSerializer;
import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.errors.ConflictException;
import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.audit.AuditLog;
import com.inventory.domain.model.product.Product;
import com.inventory.domain.ports.in.product.ProductCommandPort;
import com.inventory.domain.ports.out.AuditLogRepository;
import com.inventory.domain.ports.out.CategoryRepository;
import com.inventory.domain.ports.out.ProductRepository;
import com.inventory.domain.ports.out.SyncLogWriterPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Caso de uso: Comandos de Productos.
 */
@Service
public class ProductCommandUseCase implements ProductCommandPort {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final AuditLogRepository auditLogRepository;
    private final SyncLogWriterPort syncLogWriter;
    private final AuditSerializer auditSerializer;

    public ProductCommandUseCase(ProductRepository productRepository, CategoryRepository categoryRepository,
                                  AuditLogRepository auditLogRepository, SyncLogWriterPort syncLogWriter,
                                  AuditSerializer auditSerializer) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.auditLogRepository = auditLogRepository;
        this.syncLogWriter = syncLogWriter;
        this.auditSerializer = auditSerializer;
    }

    @Override
    public Mono<Product> create(UUID userId, CreateProductCommand command) {
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
            }))
            .flatMap(saved -> auditLogRepository.save(AuditLog.create(
                userId, "Product", saved.getId(), "CREATE",
                null, auditSerializer.toJsonTruncated(saved), null))
                .then(syncLogWriter.log("PRODUCT", saved.getId(), "CREATE", saved, null))
                .thenReturn(saved));
    }

    @Override
    public Mono<Product> update(UUID id, UUID userId, UpdateProductCommand command) {
        return productRepository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Producto", id.toString())))
            .flatMap(existing -> validateUniqueConstraints(command.sku(), command.barcode(), id)
                .then(validateCategoryIfPresent(command.categoryId()))
                .thenReturn(existing))
            .flatMap(existing -> {
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
                Product finalUpdated = updated;
                return productRepository.save(finalUpdated)
                    .flatMap(saved -> auditLogRepository.save(AuditLog.create(
                        userId, "Product", saved.getId(), "UPDATE",
                        auditSerializer.toJsonTruncated(existing), auditSerializer.toJsonTruncated(saved), null))
                        .then(syncLogWriter.log("PRODUCT", saved.getId(), "UPDATE", saved, null))
                        .thenReturn(saved));
            });
    }

    @Override
    public Mono<Product> archive(UUID id, UUID userId) {
        return productRepository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Producto", id.toString())))
            .map(Product::archive)
            .flatMap(productRepository::save)
            .flatMap(saved -> auditLogRepository.save(AuditLog.create(
                userId, "Product", saved.getId(), "ARCHIVE",
                null, auditSerializer.toJsonTruncated(saved), null))
                .then(syncLogWriter.log("PRODUCT", saved.getId(), "ARCHIVE", saved, null))
                .thenReturn(saved));
    }

    @Override
    public Mono<Product> activate(UUID id, UUID userId) {
        return productRepository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Producto", id.toString())))
            .map(Product::activate)
            .flatMap(productRepository::save)
            .flatMap(saved -> auditLogRepository.save(AuditLog.create(
                userId, "Product", saved.getId(), "ACTIVATE",
                null, auditSerializer.toJsonTruncated(saved), null))
                .then(syncLogWriter.log("PRODUCT", saved.getId(), "ACTIVATE", saved, null))
                .thenReturn(saved));
    }

    @Override
    public Mono<Void> delete(UUID id, UUID userId) {
        return productRepository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Producto", id.toString())))
            .flatMap(existing -> auditLogRepository.save(AuditLog.create(
                userId, "Product", existing.getId(), "DELETE",
                auditSerializer.toJsonTruncated(existing), null, null))
                .then(productRepository.deleteById(id))
                .then(syncLogWriter.log("PRODUCT", existing.getId(), "DELETE", existing, null)));
    }

    @Override
    public Mono<Void> deleteAll(List<UUID> ids) {
        if (ids.isEmpty()) return Mono.empty();
        return Flux.fromIterable(ids)
            .flatMap(id -> productRepository.existsById(id)
                .flatMap(exists -> exists
                    ? Mono.just(id)
                    : Mono.error(new NotFoundException("Producto", id.toString()))))
            .then(productRepository.deleteAllById(ids));
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
