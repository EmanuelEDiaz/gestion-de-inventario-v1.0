package com.inventory.application.stock.dto;

import java.math.BigDecimal;

/**
 * DTO de estadísticas del dashboard.
 */
public record DashboardStatsDto(
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
