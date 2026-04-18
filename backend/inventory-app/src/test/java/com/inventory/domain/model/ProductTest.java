package com.inventory.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests unitarios para la entidad de dominio Product.
 * Sin Spring — dominio puro.
 */
@DisplayName("Product Domain Entity")
class ProductTest {

    @Test
    @DisplayName("create() genera un UUID válido y aplica defaults")
    void create_setsDefaultValues() {
        Product p = Product.create("Leche entera", "SKU-001", null, BigDecimal.valueOf(10));

        assertThat(p.getId()).isNotNull();
        assertThat(p.getName()).isEqualTo("Leche entera");
        assertThat(p.getSku()).isEqualTo("SKU-001");
        assertThat(p.getStatus()).isEqualTo(Product.ProductStatus.ACTIVE);
        assertThat(p.getCurrencyCode()).isEqualTo("CUP");
        assertThat(p.getTaxRate()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(p.getUnitOfMeasure()).isEqualTo("UNIT");
    }

    @Test
    @DisplayName("Constructor lanza excepción cuando name es null")
    void constructor_throwsWhenNameIsNull() {
        assertThatThrownBy(() ->
            new Product(UUID.randomUUID(), "SKU-001", null, null, null,
                null, Product.ProductStatus.ACTIVE, Product.CostMethod.STANDARD,
                null, BigDecimal.ONE, null, "CUP", BigDecimal.ZERO, "UNIT",
                Instant.now(), Instant.now(), 0)
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("name");
    }

    @Test
    @DisplayName("Constructor lanza excepción cuando name está en blanco")
    void constructor_throwsWhenNameIsBlank() {
        assertThatThrownBy(() ->
            new Product(UUID.randomUUID(), "SKU-001", null, "   ", null,
                null, Product.ProductStatus.ACTIVE, Product.CostMethod.STANDARD,
                null, BigDecimal.ONE, null, "CUP", BigDecimal.ZERO, "UNIT",
                Instant.now(), Instant.now(), 0)
        ).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("updateBasicInfo() retorna un nuevo Product con nombre actualizado (inmutabilidad)")
    void updateBasicInfo_returnsNewProductWithUpdatedName() {
        Product original = Product.create("Nombre antiguo", "SKU-002", null, BigDecimal.ONE);
        Product updated = original.updateBasicInfo("Nombre nuevo", null, null, null);

        assertThat(updated.getName()).isEqualTo("Nombre nuevo");
        assertThat(original.getName()).isEqualTo("Nombre antiguo");
        assertThat(updated.getId()).isEqualTo(original.getId());
    }

    @Test
    @DisplayName("archive() cambia el estado a ARCHIVED preservando los demás campos")
    void archive_setsStatusToArchived() {
        Product active = Product.create("Producto", "SKU-003", null, BigDecimal.ONE);
        Product archived = active.archive();

        assertThat(archived.getStatus()).isEqualTo(Product.ProductStatus.ARCHIVED);
        assertThat(active.getStatus()).isEqualTo(Product.ProductStatus.ACTIVE);
        assertThat(archived.getId()).isEqualTo(active.getId());
    }

    @Test
    @DisplayName("activate() restaura el estado a ACTIVE")
    void activate_setsStatusToActive() {
        Product active = Product.create("Producto", "SKU-004", null, BigDecimal.ONE);
        Product archived = active.archive();
        Product reactivated = archived.activate();

        assertThat(reactivated.getStatus()).isEqualTo(Product.ProductStatus.ACTIVE);
    }
}
