package com.inventory.application.usecase.query;

import com.inventory.domain.model.stock.StockBalance;
import com.inventory.domain.ports.in.StockQueryPort;
import com.inventory.domain.ports.out.StockRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: Consultas de Stock.
 * Implementa las consultas de balances de inventario.
 */
@Service
public class StockQueryUseCase implements StockQueryPort {

    private final StockRepository stockRepository;

    public StockQueryUseCase(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    @Override
    public Mono<StockBalance> getBalance(UUID warehouseId, UUID productId) {
        return stockRepository.findById(warehouseId, productId)
                .switchIfEmpty(Mono.just(StockBalance.empty(warehouseId, productId)));
    }

    @Override
    public Flux<StockBalance> getBalancesByWarehouse(UUID warehouseId, boolean belowReorderOnly) {
        Flux<StockBalance> balances = stockRepository.findByWarehouseId(warehouseId);
        if (belowReorderOnly) {
            return balances.filter(b -> b.getOnHand().compareTo(java.math.BigDecimal.ZERO) <= 0);
        }
        return balances;
    }

    @Override
    public Flux<StockBalance> getBalancesByProduct(UUID productId) {
        return stockRepository.findByProductId(productId);
    }

    @Override
    public Flux<StockBalance> getAllBalances(StockFilter filter) {
        Flux<StockBalance> balances = stockRepository.findAll(filter.page(), filter.size());
        
        if (filter.warehouseId() != null) {
            balances = balances.filter(b -> b.getWarehouseId().equals(filter.warehouseId()));
        }
        if (filter.productId() != null) {
            balances = balances.filter(b -> b.getProductId().equals(filter.productId()));
        }
        if (Boolean.TRUE.equals(filter.outOfStock())) {
            balances = balances.filter(b -> b.getOnHand().compareTo(java.math.BigDecimal.ZERO) <= 0);
        }
        
        return balances;
    }

    @Override
    public Flux<StockBalance> getLowStockAlerts() {
        return stockRepository.findBelowReorderPoint();
    }
}
