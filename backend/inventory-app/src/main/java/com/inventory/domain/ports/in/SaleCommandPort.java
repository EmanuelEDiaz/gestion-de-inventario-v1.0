package com.inventory.domain.ports.in;

import com.inventory.domain.model.Sale;
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

    record CreateCommand(
        UUID warehouseId,
        UUID customerId,
        String currencyCode,
        String notes,
        LocalDate saleDate,
        List<SaleLineCommand> lines
    ) {
        public record SaleLineCommand(
            UUID productId,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal discount
        ) {}
    }
}
