package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.CategoryEntity;
import com.inventory.adapters.persistence.adapter.mapper.CatalogPersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.CategoryR2dbcRepository;
import com.inventory.domain.model.category.Category;
import com.inventory.domain.ports.out.CategoryRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

@Repository
public class CategoryRepositoryAdapter implements CategoryRepository {

    private final CategoryR2dbcRepository r2dbcRepository;
    private final CatalogPersistenceMapper mapper;

    public CategoryRepositoryAdapter(CategoryR2dbcRepository r2dbcRepository,
                                      CatalogPersistenceMapper mapper) {
        this.r2dbcRepository = r2dbcRepository;
        this.mapper = mapper;
    }

    @Override
    public Mono<Category> findById(UUID id) {
        return r2dbcRepository.findById(id)
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Category> findAll() {
        return r2dbcRepository.findAll()
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Category> findAllActive() {
        return r2dbcRepository.findAllActive()
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Category> findRoots() {
        return r2dbcRepository.findRoots()
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Category> findByParentId(UUID parentId) {
        return r2dbcRepository.findByParentIdOrderBySortOrder(parentId)
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Category> findDescendants(UUID categoryId) {
        return r2dbcRepository.findById(categoryId)
            .flatMapMany(parent -> r2dbcRepository.findDescendantsByPath(parent.getPath()))
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Category> save(Category category) {
        return r2dbcRepository.findById(category.getId())
            .flatMap(existing -> {
                CategoryEntity entity = mapper.toEntity(category, false);
                return r2dbcRepository.save(entity);
            })
            .switchIfEmpty(Mono.defer(() -> {
                CategoryEntity entity = mapper.toEntity(category, true);
                return r2dbcRepository.save(entity);
            }))
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Boolean> existsByName(String name) {
        return r2dbcRepository.existsByName(name);
    }

    @Override
    public Mono<Boolean> existsByNameAndParentId(String name, UUID parentId) {
        return r2dbcRepository.existsByNameAndParentId(name, parentId);
    }

    @Override
    public Mono<Void> deleteById(UUID id) {
        return r2dbcRepository.deleteById(id);
    }

    @Override
    public Mono<Void> deleteAllById(List<UUID> ids) {
        if (ids.isEmpty()) return Mono.empty();
        return r2dbcRepository.deleteAllById(ids);
    }

    @Override
    public Mono<Long> countProducts(UUID categoryId) {
        return r2dbcRepository.countProductsByCategoryId(categoryId);
    }
}
