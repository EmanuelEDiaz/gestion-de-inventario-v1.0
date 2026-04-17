package com.inventory.domain.ports.in;

import com.inventory.application.dto.DashboardStatsDto;
import com.inventory.application.dto.LowStockItemDto;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Puerto de entrada para estadísticas del dashboard.
 */
public interface DashboardQueryPort {
    Mono<DashboardStatsDto> getStats();
    Flux<LowStockItemDto> getLowStockItems();
}
