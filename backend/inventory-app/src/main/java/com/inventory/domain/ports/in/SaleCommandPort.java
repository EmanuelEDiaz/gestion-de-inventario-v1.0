package com.inventory.domain.ports.in;

import com.inventory.application.dto.CreateSaleRequest;
import com.inventory.domain.model.Sale;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface SaleCommandPort {
    Mono<Sale> create(CreateSaleRequest request, UUID createdBy);
    Mono<Sale> confirm(UUID saleId);
    Mono<Sale> deliver(UUID saleId);
    Mono<Sale> cancel(UUID saleId);
    Mono<Void> delete(UUID saleId);
}
