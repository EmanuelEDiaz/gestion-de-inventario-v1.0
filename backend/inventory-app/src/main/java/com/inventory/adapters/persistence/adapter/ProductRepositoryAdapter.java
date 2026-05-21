package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.ProductEntity;
import com.inventory.adapters.persistence.adapter.mapper.CatalogPersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.ProductR2dbcRepository;
import com.inventory.domain.model.product.Product;
import com.inventory.domain.ports.in.product.ProductFilter;
import com.inventory.domain.ports.out.ProductRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class ProductRepositoryAdapter implements ProductRepository {

    private final ProductR2dbcRepository r2dbcRepository;
    private final CatalogPersistenceMapper mapper;

    public ProductRepositoryAdapter(ProductR2dbcRepository r2dbcRepository,
                                     CatalogPersistenceMapper mapper) {
        this.r2dbcRepository = r2dbcRepository;
        this.mapper = mapper;
    }

    @Override
    public Mono<Product> findById(UUID id) {
        return r2dbcRepository.findById(id)
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Product> findBySku(String sku) {
        return r2dbcRepository.findBySku(sku)
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Product> findByBarcode(String barcode) {
        return r2dbcRepository.findByBarcode(barcode)
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Product> findAll() {
        return r2dbcRepository.findAll()
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Product> findAllActive() {
        return r2dbcRepository.findAllActive()
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Product> findByCategory(UUID categoryId) {
        return r2dbcRepository.findByCategoryId(categoryId)
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Product> findByStatus(Product.ProductStatus status) {
        return r2dbcRepository.findByStatus(status.name())
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Product> search(String query) {
        return r2dbcRepository.search(query)
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Product> findAllPaginated(int page, int size) {
        int offset = page * size;
        return r2dbcRepository.findAllPaginated(offset, size)
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Product> findAllWithCursor(String cursor, ProductFilter filter, boolean activeOnly) {
        return r2dbcRepository.findWithCursorAndFilter(
                cursor,
                filter.getSize(),
                activeOnly ? "ACTIVE" : null,
                filter.getSearch(),
                filter.getCategoryId(),
                filter.getMinPrice(),
                filter.getMaxPrice(),
                filter.getUnitOfMeasure(),
                filter.getSortBy(),
                filter.isSortAsc()
            )
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Product> findAllFiltered(ProductFilter filter, boolean activeOnly) {
        if (filter.isEmpty()) {
            return activeOnly ? findAllActive() : findAll();
        }
        return r2dbcRepository.findWithFilter(
                filter.getSearch(),
                filter.getCategoryId(),
                activeOnly ? "ACTIVE" : null,
                filter.getMinPrice(),
                filter.getMaxPrice(),
                filter.getUnitOfMeasure(),
                filter.getSortBy(),
                filter.isSortAsc(),
                filter.getPage() * filter.getSize(),
                filter.getSize()
            )
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Product> findAllByWarehouse(UUID warehouseId, String search, UUID categoryId, String status, boolean activeOnly) {
        return r2dbcRepository.findWithFilter(search, categoryId, status, null, null, null, "name", true, 0, 20)
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Long> count() {
        return r2dbcRepository.count();
    }

    @Override
    public Mono<Long> countByStatus(Product.ProductStatus status) {
        return r2dbcRepository.countByStatus(status.name());
    }

    @Override
    public Mono<Product> save(Product product) {
        return r2dbcRepository.findById(product.getId())
            .flatMap(existing -> {
                ProductEntity entity = mapper.toEntity(product, false);
                return r2dbcRepository.save(entity);
            })
            .switchIfEmpty(Mono.defer(() -> {
                ProductEntity entity = mapper.toEntity(product, true);
                return r2dbcRepository.save(entity);
            }))
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Void> updateMainImage(UUID productId, String filePath) {
        return r2dbcRepository.updateMainImage(productId, filePath).then();
    }

    @Override
    public Mono<Void> clearMainImage(UUID productId) {
        return r2dbcRepository.clearMainImage(productId).then();
    }

    @Override
    public Mono<Boolean> existsBySku(String sku) {
        return r2dbcRepository.existsBySku(sku);
    }

    @Override
    public Mono<Boolean> existsByBarcode(String barcode) {
        return r2dbcRepository.existsByBarcode(barcode);
    }

    @Override
    public Mono<Boolean> existsById(UUID id) {
        return r2dbcRepository.existsById(id);
    }

    @Override
    public Mono<Void> deleteById(UUID id) {
        return r2dbcRepository.deleteById(id);
    }
}
