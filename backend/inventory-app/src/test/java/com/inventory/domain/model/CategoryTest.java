package com.inventory.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

@DisplayName("Category Domain Entity")
class CategoryTest {

    @Test
    @DisplayName("createRoot() builds a root category with auto-generated path")
    void createRoot_setsDefaults() {
        Category cat = Category.createRoot("Electrónica", 1);

        assertThat(cat.getId()).isNotNull();
        assertThat(cat.getName()).isEqualTo("Electrónica");
        assertThat(cat.getParentId()).isNull();
        assertThat(cat.getPath()).isEqualTo("/" + cat.getId());
        assertThat(cat.getLevel()).isZero();
        assertThat(cat.getSortOrder()).isEqualTo(1);
        assertThat(cat.isActive()).isTrue();
        assertThat(cat.isRoot()).isTrue();
        assertThat(cat.getVersion()).isZero();
    }

    @Test
    @DisplayName("createRoot() trims whitespace from name")
    void createRoot_trimsName() {
        Category cat = Category.createRoot("  Categoría  ", 1);

        assertThat(cat.getName()).isEqualTo("Categoría");
    }

    @Test
    @DisplayName("createChild() builds a child category with correct path and level")
    void createChild_setsPathAndLevel() {
        Category parent = Category.createRoot("Padre", 1);
        Category child = Category.createChild(parent, "Hijo", 2);

        assertThat(child.getParentId()).isEqualTo(parent.getId());
        assertThat(child.getPath()).isEqualTo(parent.getPath() + "/" + child.getId());
        assertThat(child.getLevel()).isEqualTo(1);
        assertThat(child.isRoot()).isFalse();
        assertThat(child.isActive()).isTrue();
    }

    @Test
    @DisplayName("createChild() treats null parent as root")
    void createChild_withNullParent_createsRoot() {
        Category cat = Category.createChild(null, "Solo", 1);

        assertThat(cat.isRoot()).isTrue();
        assertThat(cat.getParentId()).isNull();
        assertThat(cat.getLevel()).isZero();
    }

    @Test
    @DisplayName("Constructor throws when name is null")
    void constructor_throwsWhenNameNull() {
        assertThatThrownBy(() ->
            new Category(UUID.randomUUID(), null, null, null, 0, 0, true, null, null, 0)
        ).isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("name");
    }

    @Test
    @DisplayName("Constructor throws when name is blank")
    void constructor_throwsWhenNameBlank() {
        assertThatThrownBy(() ->
            new Category(UUID.randomUUID(), null, "   ", null, 0, 0, true, null, null, 0)
        ).isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("name");
    }

    @Test
    @DisplayName("rename() returns new category with updated name")
    void rename_changesName() {
        Category original = Category.createRoot("Viejo nombre", 1);
        Category renamed = original.rename("Nuevo nombre");

        assertThat(renamed.getName()).isEqualTo("Nuevo nombre");
        assertThat(original.getName()).isEqualTo("Viejo nombre");
        assertThat(renamed.getId()).isEqualTo(original.getId());
        assertThat(renamed.getPath()).isEqualTo(original.getPath());
        assertThat(renamed.isActive()).isTrue();
    }

    @Test
    @DisplayName("reorder() returns new category with updated sort order")
    void reorder_changesSortOrder() {
        Category original = Category.createRoot("Test", 1);
        Category reordered = original.reorder(5);

        assertThat(reordered.getSortOrder()).isEqualTo(5);
        assertThat(original.getSortOrder()).isEqualTo(1);
    }

    @Test
    @DisplayName("deactivate() sets active to false")
    void deactivate_setsInactive() {
        Category cat = Category.createRoot("Activa", 1);
        Category inactive = cat.deactivate();

        assertThat(inactive.isActive()).isFalse();
        assertThat(cat.isActive()).isTrue();
        assertThat(inactive.getId()).isEqualTo(cat.getId());
    }

    @Test
    @DisplayName("activate() sets active to true")
    void activate_setsActive() {
        Category cat = Category.createRoot("Test", 1);
        Category deactivated = cat.deactivate();
        Category reactivated = deactivated.activate();

        assertThat(reactivated.isActive()).isTrue();
    }

    @Test
    @DisplayName("isDescendantOf() returns true when path starts with ancestor path")
    void isDescendantOf_checksPath() {
        Category parent = Category.createRoot("Parent", 1);
        Category child = Category.createChild(parent, "Child", 1);
        Category grandchild = Category.createChild(child, "Grandchild", 1);

        assertThat(child.isDescendantOf(parent)).isTrue();
        assertThat(grandchild.isDescendantOf(parent)).isTrue();
        assertThat(grandchild.isDescendantOf(child)).isTrue();
        assertThat(parent.isDescendantOf(child)).isFalse();
        assertThat(parent.isDescendantOf(parent)).isFalse();
    }

    @Test
    @DisplayName("withVersion() returns new category with incremented version")
    void withVersion_updatesVersion() {
        Category cat = Category.createRoot("Test", 1);
        Category updated = cat.withVersion(3);

        assertThat(updated.getVersion()).isEqualTo(3);
        assertThat(cat.getVersion()).isZero();
        assertThat(updated.getId()).isEqualTo(cat.getId());
    }
}
