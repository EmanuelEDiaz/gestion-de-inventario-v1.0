package com.inventory.domain.ports.in.sale;

import com.inventory.domain.model.sale.Sale;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface SaleCommandPort {
    Mono<Sale> create(CreateCommand command, UUID createdBy);
    Mono<Sale> confirm(UUID saleId);
    Mono<Sale> deliver(UUID saleId);
    Mono<Sale> cancel(UUID saleId);
    Mono<Void> delete(UUID saleId);
    Mono<Void> deleteAll(List<UUID> ids);

    record CreateCommand(
        UUID warehouseId,
        UUID customerId,
        String currencyCode,
        String notes,
        LocalDate saleDate,
        List<SaleLineCommand> lines,
        Sale.PaymentMode paymentMode
    ) {
        public record SaleLineCommand(
            UUID productId,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal discount
        ) {}
    }
}
