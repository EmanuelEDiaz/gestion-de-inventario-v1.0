package com.inventory.domain.errors;

import java.util.UUID;

public class CategoryNotFoundError extends DomainException {

    private final UUID categoryId;

    public CategoryNotFoundError(UUID categoryId) {
        super("CATEGORY_NOT_FOUND", "Categoría no encontrada: " + categoryId);
        this.categoryId = categoryId;
    }

    public CategoryNotFoundError(String identifier) {
        super("CATEGORY_NOT_FOUND", "Categoría no encontrada: " + identifier);
        this.categoryId = UUID.fromString(identifier);
    }

    public UUID getCategoryId() {
        return categoryId;
    }
}
