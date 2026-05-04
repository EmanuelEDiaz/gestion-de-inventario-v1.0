package com.inventory.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests unitarios para StockBalance.
 * Cubre lógica de negocio de inventario (disponibilidad, WAC, inmutabilidad).
 */
@DisplayName("StockBalance Domain Model")
class StockBalanceTest {

    private final UUID warehouseId = UUID.randomUUID();
    private final UUID productId = UUID.randomUUID();

    @Test
    @DisplayName("empty() crea un balance en cero")
    void empty_createsZeroBalance() {
        StockBalance balance = StockBalance.empty(warehouseId, productId);

        assertThat(balance.getOnHand()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(balance.getReserved()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(balance.getAvailable()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("getAvailable() retorna onHand - reserved")
    void getAvailable_returnsOnHandMinusReserved() {
        StockBalance balance = new StockBalance(
            warehouseId, productId,
            BigDecimal.valueOf(100), BigDecimal.valueOf(20),
            BigDecimal.valueOf(5), null
        );

        assertThat(balance.getAvailable()).isEqualByComparingTo(BigDecimal.valueOf(80));
    }

    @Test
    @DisplayName("hasAvailable() retorna true cuando hay stock suficiente")
    void hasAvailable_returnsTrueWhenEnoughStock() {
        StockBalance balance = new StockBalance(
            warehouseId, productId,
            BigDecimal.valueOf(50), BigDecimal.ZERO, null, null
        );

        assertThat(balance.hasAvailable(BigDecimal.valueOf(50))).isTrue();
        assertThat(balance.hasAvailable(BigDecimal.valueOf(51))).isFalse();
        assertThat(balance.hasAvailable(BigDecimal.ZERO)).isTrue();
    }

    @Test
    @DisplayName("isBelowReorderPoint() detecta correctamente stock bajo")
    void isBelowReorderPoint_detectsLowStock() {
        StockBalance balance = new StockBalance(
            warehouseId, productId,
            BigDecimal.valueOf(5), BigDecimal.ZERO, null, null
        );

        assertThat(balance.isBelowReorderPoint(BigDecimal.valueOf(10))).isTrue();
        assertThat(balance.isBelowReorderPoint(BigDecimal.valueOf(5))).isFalse();
        assertThat(balance.isBelowReorderPoint(null)).isFalse();
    }

    @Test
    @DisplayName("addStock() actualiza onHand y recalcula WAC correctamente")
    void addStock_updatesOnHandAndRecalculatesWAC() {
        StockBalance balance = new StockBalance(
            warehouseId, productId,
            BigDecimal.valueOf(10), BigDecimal.ZERO,
            BigDecimal.valueOf(100), null
        );

        // Compramos 5 unidades a 120 cada una → nuevo WAC = (10*100 + 5*120)/(10+5) = 106.6667 (escala 4)
        StockBalance updated = balance.addStock(BigDecimal.valueOf(5), BigDecimal.valueOf(120));

        assertThat(updated.getOnHand()).isEqualByComparingTo(BigDecimal.valueOf(15));
        assertThat(updated.getAvgCost()).isEqualByComparingTo(new BigDecimal("106.6667"));
    }

    @Test
    @DisplayName("removeStock() reduce onHand sin cambiar el costo promedio")
    void removeStock_reducesOnHand() {
        StockBalance balance = new StockBalance(
            warehouseId, productId,
            BigDecimal.valueOf(20), BigDecimal.ZERO,
            BigDecimal.valueOf(50), null
        );

        StockBalance updated = balance.removeStock(BigDecimal.valueOf(8));

        assertThat(updated.getOnHand()).isEqualByComparingTo(BigDecimal.valueOf(12));
        assertThat(updated.getAvgCost()).isEqualByComparingTo(BigDecimal.valueOf(50));
    }

    @Test
    @DisplayName("getTotalValue() calcula onHand * avgCost")
    void getTotalValue_calculatesCorrectly() {
        StockBalance balance = new StockBalance(
            warehouseId, productId,
            BigDecimal.valueOf(10), BigDecimal.ZERO,
            BigDecimal.valueOf(25), null
        );

        assertThat(balance.getTotalValue()).isEqualByComparingTo(BigDecimal.valueOf(250));
    }

    @Test
    @DisplayName("getTotalValue() retorna null cuando avgCost es null")
    void getTotalValue_returnsNullWhenNoCost() {
        StockBalance balance = StockBalance.empty(warehouseId, productId);
        assertThat(balance.getTotalValue()).isNull();
    }

    @Test
    @DisplayName("Constructor lanza excepción con warehouseId null")
    void constructor_throwsWithNullWarehouseId() {
        assertThatThrownBy(() ->
            new StockBalance(null, productId, BigDecimal.ZERO, BigDecimal.ZERO, null, null)
        ).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Constructor lanza excepción con productId null")
    void constructor_throwsWithNullProductId() {
        assertThatThrownBy(() ->
            new StockBalance(warehouseId, null, BigDecimal.ZERO, BigDecimal.ZERO, null, null)
        ).isInstanceOf(IllegalArgumentException.class);
    }
}
