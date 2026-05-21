package com.inventory.domain.model.purchase;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

@DisplayName("Purchase Domain Entity")
class PurchaseTest {

    private final UUID warehouseId = UUID.randomUUID();
    private final UUID supplierId = UUID.randomUUID();
    private final UUID productId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    private PurchaseLine createLine(BigDecimal qty, BigDecimal cost) {
        return PurchaseLine.create(productId, qty, cost, 1);
    }

    private List<PurchaseLine> singleLine() {
        return List.of(createLine(BigDecimal.TEN, BigDecimal.valueOf(50)));
    }

    @Test
    @DisplayName("create() builds a DRAFT purchase with calculated subtotal")
    void create_setsDefaultValues() {
        Purchase p = Purchase.create("PO-001", warehouseId, supplierId, userId, singleLine());

        assertThat(p.getId()).isNotNull();
        assertThat(p.getPurchaseNumber()).isEqualTo("PO-001");
        assertThat(p.getWarehouseId()).isEqualTo(warehouseId);
        assertThat(p.getSupplierId()).isEqualTo(supplierId);
        assertThat(p.getStatus()).isEqualTo(Purchase.PurchaseStatus.DRAFT);
        assertThat(p.getCurrencyCode()).isEqualTo("CUP");
        assertThat(p.getSubtotal()).isEqualByComparingTo(BigDecimal.valueOf(500));
        assertThat(p.getTotal()).isEqualByComparingTo(BigDecimal.valueOf(500));
        assertThat(p.getCreatedBy()).isEqualTo(userId);
        assertThat(p.getReceivedDate()).isNull();
        assertThat(p.getVersion()).isZero();
        assertThat(p.getLines()).hasSize(1);
    }

    @Test
    @DisplayName("create() with null lines creates empty purchase")
    void create_withNullLines() {
        Purchase p = Purchase.create("PO-002", warehouseId, supplierId, userId, null);

        assertThat(p.getLines()).isEmpty();
        assertThat(p.getSubtotal()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(p.getTotal()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Constructor throws when purchaseNumber is null")
    void constructor_throwsWhenNumberNull() {
        assertThatThrownBy(() ->
            new Purchase(null, null, supplierId, warehouseId, null, null, null, null, null, null,
                null, null, null, userId, null, null, 0, singleLine())
        ).isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("number");
    }

    @Test
    @DisplayName("Constructor throws when purchaseNumber is blank")
    void constructor_throwsWhenNumberBlank() {
        assertThatThrownBy(() ->
            new Purchase(null, "   ", supplierId, warehouseId, null, null, null, null, null, null,
                null, null, null, userId, null, null, 0, singleLine())
        ).isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("number");
    }

    @Test
    @DisplayName("Constructor throws when warehouseId is null")
    void constructor_throwsWhenWarehouseNull() {
        assertThatThrownBy(() ->
            new Purchase(null, "PO-003", supplierId, null, null, null, null, null, null, null,
                null, null, null, userId, null, null, 0, singleLine())
        ).isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Warehouse");
    }

    @Test
    @DisplayName("confirm() transitions from DRAFT to CONFIRMED")
    void confirm_changesStatus() {
        Purchase draft = Purchase.create("PO-004", warehouseId, supplierId, userId, singleLine());
        Purchase confirmed = draft.confirm();

        assertThat(confirmed.getStatus()).isEqualTo(Purchase.PurchaseStatus.CONFIRMED);
        assertThat(draft.getStatus()).isEqualTo(Purchase.PurchaseStatus.DRAFT);
        assertThat(confirmed.getId()).isEqualTo(draft.getId());
    }

    @Test
    @DisplayName("confirm() throws when status is not DRAFT")
    void confirm_throwsWhenNotDraft() {
        Purchase draft = Purchase.create("PO-005", warehouseId, supplierId, userId, singleLine());
        Purchase confirmed = draft.confirm();

        assertThatThrownBy(confirmed::confirm)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Cannot confirm");
    }

    @Test
    @DisplayName("confirm() throws when lines are empty")
    void confirm_throwsWhenNoLines() {
        Purchase draft = Purchase.create("PO-006", warehouseId, supplierId, userId, List.of());

        assertThatThrownBy(draft::confirm)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Cannot confirm");
    }

    @Test
    @DisplayName("receive() transitions from CONFIRMED to RECEIVED")
    void receive_changesStatus() {
        Purchase draft = Purchase.create("PO-007", warehouseId, supplierId, userId, singleLine());
        Purchase confirmed = draft.confirm();
        Purchase received = confirmed.receive(LocalDate.now());

        assertThat(received.getStatus()).isEqualTo(Purchase.PurchaseStatus.RECEIVED);
        assertThat(received.getReceivedDate()).isNotNull();
        assertThat(received.getReceivedDate()).isEqualTo(LocalDate.now());
    }

    @Test
    @DisplayName("receive() throws when status is not CONFIRMED")
    void receive_throwsWhenNotConfirmed() {
        Purchase draft = Purchase.create("PO-008", warehouseId, supplierId, userId, singleLine());

        assertThatThrownBy(() -> draft.receive(LocalDate.now()))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Cannot receive");
    }

    @Test
    @DisplayName("cancel() transitions from DRAFT to CANCELLED")
    void cancel_draft() {
        Purchase draft = Purchase.create("PO-009", warehouseId, supplierId, userId, singleLine());
        Purchase cancelled = draft.cancel();

        assertThat(cancelled.getStatus()).isEqualTo(Purchase.PurchaseStatus.CANCELLED);
    }

    @Test
    @DisplayName("cancel() transitions from CONFIRMED to CANCELLED")
    void cancel_confirmed() {
        Purchase draft = Purchase.create("PO-010", warehouseId, supplierId, userId, singleLine());
        Purchase confirmed = draft.confirm();
        Purchase cancelled = confirmed.cancel();

        assertThat(cancelled.getStatus()).isEqualTo(Purchase.PurchaseStatus.CANCELLED);
    }

    @Test
    @DisplayName("cancel() throws when status is RECEIVED")
    void cancel_throwsWhenReceived() {
        Purchase draft = Purchase.create("PO-011", warehouseId, supplierId, userId, singleLine());
        Purchase confirmed = draft.confirm();
        Purchase received = confirmed.receive(LocalDate.now());

        assertThatThrownBy(received::cancel)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Cannot cancel");
    }

    @Test
    @DisplayName("cancel() throws when already CANCELLED")
    void cancel_throwsWhenAlreadyCancelled() {
        Purchase draft = Purchase.create("PO-012", warehouseId, supplierId, userId, singleLine());
        Purchase cancelled = draft.cancel();

        assertThatThrownBy(cancelled::cancel)
            .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("addLine() adds a line and recalculates subtotal")
    void addLine_recalculatesSubtotal() {
        Purchase draft = Purchase.create("PO-013", warehouseId, supplierId, userId, singleLine());
        PurchaseLine secondLine = PurchaseLine.create(productId, BigDecimal.valueOf(5), BigDecimal.valueOf(100), 2);
        Purchase updated = draft.addLine(secondLine);

        assertThat(updated.getLines()).hasSize(2);
        assertThat(updated.getSubtotal()).isEqualByComparingTo(BigDecimal.valueOf(1000));
        assertThat(updated.getTotal()).isEqualByComparingTo(BigDecimal.valueOf(1000));
    }

    @Test
    @DisplayName("withStatus() returns a new purchase with the given status")
    void withStatus_returnsNewStatus() {
        Purchase draft = Purchase.create("PO-014", warehouseId, supplierId, userId, singleLine());
        Purchase modified = draft.withStatus(Purchase.PurchaseStatus.CONFIRMED);

        assertThat(modified.getStatus()).isEqualTo(Purchase.PurchaseStatus.CONFIRMED);
        assertThat(draft.getStatus()).isEqualTo(Purchase.PurchaseStatus.DRAFT);
    }

    @Test
    @DisplayName("canConfirm() returns true only when DRAFT with lines")
    void canConfirm_checksState() {
        Purchase draft = Purchase.create("PO-015", warehouseId, supplierId, userId, singleLine());
        Purchase empty = Purchase.create("PO-016", warehouseId, supplierId, userId, List.of());
        Purchase confirmed = draft.confirm();

        assertThat(draft.canConfirm()).isTrue();
        assertThat(empty.canConfirm()).isFalse();
        assertThat(confirmed.canConfirm()).isFalse();
    }

    @Test
    @DisplayName("canReceive() returns true only when CONFIRMED")
    void canReceive_checksState() {
        Purchase draft = Purchase.create("PO-017", warehouseId, supplierId, userId, singleLine());
        Purchase confirmed = draft.confirm();
        Purchase received = confirmed.receive(LocalDate.now());

        assertThat(draft.canReceive()).isFalse();
        assertThat(confirmed.canReceive()).isTrue();
        assertThat(received.canReceive()).isFalse();
    }

    @Test
    @DisplayName("canCancel() returns true for DRAFT and CONFIRMED")
    void canCancel_checksState() {
        Purchase draft = Purchase.create("PO-018", warehouseId, supplierId, userId, singleLine());
        Purchase confirmed = draft.confirm();
        Purchase received = confirmed.receive(LocalDate.now());
        Purchase cancelled = draft.cancel();

        assertThat(draft.canCancel()).isTrue();
        assertThat(confirmed.canCancel()).isTrue();
        assertThat(received.canCancel()).isFalse();
        assertThat(cancelled.canCancel()).isFalse();
    }
}
