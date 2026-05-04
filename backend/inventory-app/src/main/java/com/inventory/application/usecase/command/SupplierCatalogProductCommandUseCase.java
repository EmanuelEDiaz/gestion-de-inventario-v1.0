package com.inventory.application.usecase.command;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.SupplierCatalogProduct;
import com.inventory.domain.ports.in.SupplierCatalogProductCommandPort;
import com.inventory.domain.ports.out.SupplierCatalogProductRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: comandos sobre el catálogo de productos de proveedores.
 */
@Service
public class SupplierCatalogProductCommandUseCase implements SupplierCatalogProductCommandPort {

    private final SupplierCatalogProductRepository supplierCatalogProductRepository;

    public SupplierCatalogProductCommandUseCase(SupplierCatalogProductRepository supplierCatalogProductRepository) {
        this.supplierCatalogProductRepository = supplierCatalogProductRepository;
    }

    @Override
    public Mono<SupplierCatalogProduct> add(AddCommand command) {
        SupplierCatalogProduct product = SupplierCatalogProduct.create(
            command.supplierId(),
            command.productId(),
            command.description(),
            command.unitPrice(),
            command.currencyCode()
        );
        return supplierCatalogProductRepository.save(product);
    }

    @Override
    public Mono<Void> delete(UUID catalogProductId) {
        return supplierCatalogProductRepository.findById(catalogProductId)
            .switchIfEmpty(Mono.error(new NotFoundException("SupplierCatalogProduct not found: " + catalogProductId)))
            .flatMap(p -> supplierCatalogProductRepository.deleteById(catalogProductId));
    }

    @Override
    public Flux<SupplierCatalogProduct> listBySupplierId(UUID supplierId) {
        return supplierCatalogProductRepository.findBySupplierId(supplierId);
    }
}
