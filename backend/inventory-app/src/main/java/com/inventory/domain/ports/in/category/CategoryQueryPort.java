package com.inventory.domain.ports.in.category;

import com.inventory.domain.model.category.Category;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada: Consultas de Categorías.
 */
public interface CategoryQueryPort {

    Mono<Category> findById(UUID id);

    Flux<Category> findAll(boolean activeOnly);

    Flux<Category> findByParent(UUID parentId);

    Flux<Category> findRootCategories();
}
