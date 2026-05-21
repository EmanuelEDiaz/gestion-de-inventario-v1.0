package com.inventory.domain.ports.in.stock;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Puerto de entrada para estadísticas del dashboard.
 */
public interface DashboardQueryPort {
    Mono<DashboardStats> getStats();
    Flux<LowStockItem> getLowStockItems();

    record DashboardStats(
        long totalProducts,
        long totalWarehouses,
        long totalCustomers,
        long totalSuppliers,
        long lowStockCount,
        long outOfStockCount,
        BigDecimal salesToday,
        BigDecimal salesThisWeek,
        long salesTodayCount,
        BigDecimal purchasesThisWeek
    ) {}

    record LowStockItem(
        UUID productId,
        String productName,
        String productSku,
        UUID warehouseId,
        String warehouseName,
        BigDecimal onHand,
        BigDecimal reorderPoint
    ) {}
}
