package com.inventory.domain.ports.out;

import com.inventory.domain.model.category.Category;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida: Repositorio de Categorías.
 */
public interface CategoryRepository {
    
    Mono<Category> findById(UUID id);
    
    Flux<Category> findAll();
    
    Flux<Category> findAllActive();
    
    Flux<Category> findRoots();
    
    Flux<Category> findByParentId(UUID parentId);
    
    Flux<Category> findDescendants(UUID categoryId);
    
    Mono<Category> save(Category category);
    
    Mono<Boolean> existsByName(String name);
    
    Mono<Boolean> existsByNameAndParentId(String name, UUID parentId);
    
    Mono<Void> deleteById(UUID id);
    
    Mono<Long> countProducts(UUID categoryId);
}
