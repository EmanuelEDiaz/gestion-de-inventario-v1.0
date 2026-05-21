package com.inventory.domain.model.category;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad de dominio: Categoría de productos.
 * Soporta jerarquía con materialized path.
 */
public class Category {
    private final UUID id;
    private final UUID parentId;
    private final String name;
    private final String path;
    private final int level;
    private final int sortOrder;
    private final boolean active;
    private final Instant createdAt;
    private final Instant updatedAt;
    private final int version;

    public Category(UUID id, UUID parentId, String name, String path, int level,
                    int sortOrder, boolean active, Instant createdAt, Instant updatedAt, int version) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Category name cannot be null or blank");
        }
        this.id = id != null ? id : UUID.randomUUID();
        this.parentId = parentId;
        this.name = name.trim();
        this.path = path != null ? path : "";
        this.level = level;
        this.sortOrder = sortOrder;
        this.active = active;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.updatedAt = updatedAt != null ? updatedAt : this.createdAt;
        this.version = version;
    }

    public static Category createRoot(String name, int sortOrder) {
        UUID id = UUID.randomUUID();
        return new Category(
            id,
            null,
            name,
            "/" + id,
            0,
            sortOrder,
            true,
            Instant.now(),
            Instant.now(),
            0
        );
    }

    public static Category createChild(Category parent, String name, int sortOrder) {
        if (parent == null) {
            return createRoot(name, sortOrder);
        }
        UUID id = UUID.randomUUID();
        return new Category(
            id,
            parent.getId(),
            name,
            parent.getPath() + "/" + id,
            parent.getLevel() + 1,
            sortOrder,
            true,
            Instant.now(),
            Instant.now(),
            0
        );
    }

    // Getters
    public UUID getId() { return id; }
    public UUID getParentId() { return parentId; }
    public String getName() { return name; }
    public String getPath() { return path; }
    public int getLevel() { return level; }
    public int getSortOrder() { return sortOrder; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public int getVersion() { return version; }

    public boolean isRoot() {
        return parentId == null;
    }

    public boolean isDescendantOf(Category ancestor) {
        return path.startsWith(ancestor.getPath() + "/");
    }

    public Category rename(String newName) {
        return new Category(id, parentId, newName, path, level, sortOrder, active, createdAt, Instant.now(), version);
    }

    public Category reorder(int newSortOrder) {
        return new Category(id, parentId, name, path, level, newSortOrder, active, createdAt, Instant.now(), version);
    }

    public Category deactivate() {
        return new Category(id, parentId, name, path, level, sortOrder, false, createdAt, Instant.now(), version);
    }

    public Category activate() {
        return new Category(id, parentId, name, path, level, sortOrder, true, createdAt, Instant.now(), version);
    }

    public Category withVersion(int newVersion) {
        return new Category(id, parentId, name, path, level, sortOrder, active, createdAt, updatedAt, newVersion);
    }
}
