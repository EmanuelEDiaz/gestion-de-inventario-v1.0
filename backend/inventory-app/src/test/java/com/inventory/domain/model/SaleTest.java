package com.inventory.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests unitarios para Sale y SaleLine (aggregate root + value object).
 */
@DisplayName("Sale Domain Aggregate")
class SaleTest {

    private final UUID warehouseId = UUID.randomUUID();
    private final UUID productId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @Test
    @DisplayName("SaleLine.create() calcula totalPrice = qty * unitPrice - discount")
    void saleLine_calculatesTotal() {
        SaleLine line = SaleLine.create(productId, 3, BigDecimal.valueOf(100), BigDecimal.valueOf(10), 1);

        assertThat(line.totalPrice()).isEqualByComparingTo(BigDecimal.valueOf(290));
        assertThat(line.productId()).isEqualTo(productId);
        assertThat(line.quantity()).isEqualTo(3);
    }

    @Test
    @DisplayName("SaleLine.create() usa descuento cero cuando es null")
    void saleLine_usesZeroDiscountWhenNull() {
        SaleLine line = SaleLine.create(productId, 2, BigDecimal.valueOf(50), null, 1);

        assertThat(line.discount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(line.totalPrice()).isEqualByComparingTo(BigDecimal.valueOf(100));
    }

    @Test
    @DisplayName("SaleLine lanza excepción cuando quantity <= 0")
    void saleLine_throwsWithNonPositiveQuantity() {
        assertThatThrownBy(() ->
            SaleLine.create(productId, 0, BigDecimal.ONE, null, 1)
        ).isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() ->
            SaleLine.create(productId, -1, BigDecimal.ONE, null, 1)
        ).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Sale.createDraft() calcula subtotal sumando líneas")
    void sale_createDraft_calculatesSubtotal() {
        List<SaleLine> lines = List.of(
            SaleLine.create(productId, 2, BigDecimal.valueOf(100), BigDecimal.ZERO, 1),
            SaleLine.create(productId, 1, BigDecimal.valueOf(50), BigDecimal.ZERO, 2)
        );

        Sale sale = Sale.createDraft(
            "VEN-001", warehouseId, null, "USD", null, LocalDate.now(), lines, userId
        );

        assertThat(sale.subtotal()).isEqualByComparingTo(BigDecimal.valueOf(250));
        assertThat(sale.total()).isEqualByComparingTo(BigDecimal.valueOf(250));
        assertThat(sale.status()).isEqualTo(Sale.SaleStatus.DRAFT);
        assertThat(sale.lines()).hasSize(2);
    }

    @Test
    @DisplayName("Sale lanza excepción cuando saleNumber está en blanco")
    void sale_throwsWhenSaleNumberBlank() {
        assertThatThrownBy(() ->
            Sale.createDraft("", warehouseId, null, "USD", null, LocalDate.now(), List.of(), userId)
        ).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Sale lanza excepción cuando warehouseId es null")
    void sale_throwsWhenWarehouseIdNull() {
        assertThatThrownBy(() ->
            Sale.createDraft("VEN-001", null, null, "USD", null, LocalDate.now(), List.of(), userId)
        ).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Sale.confirm() cambia status a CONFIRMED")
    void sale_confirm_changesStatus() {
        List<SaleLine> lines = List.of(
            SaleLine.create(productId, 1, BigDecimal.valueOf(100), BigDecimal.ZERO, 1)
        );
        Sale draft = Sale.createDraft("VEN-001", warehouseId, null, "USD", null, LocalDate.now(), lines, userId);
        Sale confirmed = draft.confirm();

        assertThat(confirmed.status()).isEqualTo(Sale.SaleStatus.CONFIRMED);
        assertThat(draft.status()).isEqualTo(Sale.SaleStatus.DRAFT);
    }
}
