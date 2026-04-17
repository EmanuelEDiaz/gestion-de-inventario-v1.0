package com.inventory.domain.ports.in;

import com.inventory.domain.model.Category;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada: Comandos de Categorías.
 */
public interface CategoryCommandPort {

    Mono<Category> create(CreateCategoryCommand command);

    Mono<Category> update(UUID id, UpdateCategoryCommand command);

    Mono<Void> delete(UUID id);

    // ===== Command Records =====

    record CreateCategoryCommand(
        String name,
        UUID parentId,
        int sortOrder
    ) {}

    record UpdateCategoryCommand(
        String name,
        UUID parentId,
        int sortOrder
    ) {}
}
