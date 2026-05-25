package com.inventory.domain.ports.in.category;

import com.inventory.domain.model.category.Category;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

/**
 * Puerto de entrada: Comandos de Categorías.
 */
public interface CategoryCommandPort {

    Mono<Category> create(CreateCategoryCommand command);

    Mono<Category> update(UUID id, UpdateCategoryCommand command);

    Mono<Void> delete(UUID id);

    Mono<Void> deleteAll(List<UUID> ids);

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
