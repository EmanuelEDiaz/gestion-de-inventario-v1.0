package com.inventory.adapters.web.controller;

import com.inventory.application.stock.dto.StockBalanceDto;
import com.inventory.application.mapper.StockBalanceMapper;
import com.inventory.domain.ports.in.stock.StockQueryPort;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Controller REST para consultas de Stock.
 */
@RestController
@RequestMapping("/api/v1/stock")
public class StockController {

    private final StockQueryPort stockQueryPort;
    private final StockBalanceMapper mapper;

    public StockController(StockQueryPort stockQueryPort, StockBalanceMapper mapper) {
        this.stockQueryPort = stockQueryPort;
        this.mapper = mapper;
    }

    @GetMapping
    public Flux<StockBalanceDto> getAllBalances(
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) Boolean belowReorderPoint,
            @RequestParam(required = false) Boolean outOfStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        StockQueryPort.StockFilter filter = new StockQueryPort.StockFilter(
            warehouseId, productId, categoryId, belowReorderPoint, outOfStock, page, size
        );
        
        return stockQueryPort.getAllBalances(filter)
                .map(mapper::toDto);
    }

    @GetMapping("/warehouse/{warehouseId}")
    public Flux<StockBalanceDto> getByWarehouse(
            @PathVariable UUID warehouseId,
            @RequestParam(defaultValue = "false") boolean belowReorderOnly) {
        
        return stockQueryPort.getBalancesByWarehouse(warehouseId, belowReorderOnly)
                .map(mapper::toDto);
    }

    @GetMapping("/product/{productId}")
    public Flux<StockBalanceDto> getByProduct(@PathVariable UUID productId) {
        return stockQueryPort.getBalancesByProduct(productId)
                .map(mapper::toDto);
    }

    @GetMapping("/warehouse/{warehouseId}/product/{productId}")
    public Mono<StockBalanceDto> getBalance(
            @PathVariable UUID warehouseId,
            @PathVariable UUID productId) {
        
        return stockQueryPort.getBalance(warehouseId, productId)
                .map(mapper::toDto);
    }

    @GetMapping("/alerts/low-stock")
    public Flux<StockBalanceDto> getLowStockAlerts() {
        return stockQueryPort.getLowStockAlerts()
                .map(mapper::toDto);
    }
}
