package com.inventory.adapters.web.controller;

import com.inventory.application.dto.DashboardStatsDto;
import com.inventory.application.dto.LowStockItemDto;
import com.inventory.domain.ports.in.DashboardQueryPort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * REST Controller para el dashboard de KPIs.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardQueryPort queryPort;

    public DashboardController(DashboardQueryPort queryPort) {
        this.queryPort = queryPort;
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER')")
    public Mono<DashboardStatsDto> getStats() {
        return queryPort.getStats();
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Flux<LowStockItemDto> getLowStockItems() {
        return queryPort.getLowStockItems();
    }
}
