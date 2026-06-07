package com.inventory.adapters.web.controller.report;

import com.inventory.application.dto.report.InventoryReportResponse;
import com.inventory.application.dto.report.InventoryValueResponse;
import com.inventory.application.dto.report.ProfitSummaryResponse;
import com.inventory.application.dto.report.SalesReportResponse;
import com.inventory.application.dto.report.SalesTimelinePoint;
import com.inventory.application.dto.report.TopCustomerEntry;
import com.inventory.application.dto.report.TopProductEntry;
import com.inventory.application.usecase.query.report.InventoryReportUseCase;
import com.inventory.application.usecase.query.report.InventoryValueUseCase;
import com.inventory.application.usecase.query.report.ProfitSummaryUseCase;
import com.inventory.application.usecase.query.report.SalesReportUseCase;
import com.inventory.application.usecase.query.report.SalesTimelineUseCase;
import com.inventory.application.usecase.query.report.TopCustomersUseCase;
import com.inventory.application.usecase.query.report.TopProductsUseCase;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final SalesReportUseCase salesReportUseCase;
    private final InventoryReportUseCase inventoryReportUseCase;
    private final SalesTimelineUseCase salesTimelineUseCase;
    private final TopProductsUseCase topProductsUseCase;
    private final TopCustomersUseCase topCustomersUseCase;
    private final ProfitSummaryUseCase profitSummaryUseCase;
    private final InventoryValueUseCase inventoryValueUseCase;

    public ReportController(SalesReportUseCase salesReportUseCase,
                            InventoryReportUseCase inventoryReportUseCase,
                            SalesTimelineUseCase salesTimelineUseCase,
                            TopProductsUseCase topProductsUseCase,
                            TopCustomersUseCase topCustomersUseCase,
                            ProfitSummaryUseCase profitSummaryUseCase,
                            InventoryValueUseCase inventoryValueUseCase) {
        this.salesReportUseCase = salesReportUseCase;
        this.inventoryReportUseCase = inventoryReportUseCase;
        this.salesTimelineUseCase = salesTimelineUseCase;
        this.topProductsUseCase = topProductsUseCase;
        this.topCustomersUseCase = topCustomersUseCase;
        this.profitSummaryUseCase = profitSummaryUseCase;
        this.inventoryValueUseCase = inventoryValueUseCase;
    }

    @GetMapping("/sales")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('reports:read')")
    public Mono<SalesReportResponse> getSalesReport(
        @RequestParam(required = false) Instant fromDate,
        @RequestParam(required = false) Instant toDate,
        @RequestParam(required = false) UUID warehouseId
    ) {
        return salesReportUseCase.execute(fromDate, toDate, warehouseId);
    }

    @GetMapping("/inventory")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('reports:read')")
    public Mono<InventoryReportResponse> getInventoryReport(
        @RequestParam(required = false) UUID warehouseId,
        @RequestParam(required = false) UUID categoryId
    ) {
        return inventoryReportUseCase.execute(warehouseId, categoryId);
    }

    @GetMapping("/sales-timeline")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('reports:read')")
    public Flux<SalesTimelinePoint> getSalesTimeline(
        @RequestParam(required = false) Instant fromDate,
        @RequestParam(required = false) Instant toDate,
        @RequestParam(required = false) UUID warehouseId,
        @RequestParam(defaultValue = "month") String granularity
    ) {
        return salesTimelineUseCase.execute(fromDate, toDate, warehouseId, granularity);
    }

    @GetMapping("/top-products")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('reports:read')")
    public Flux<TopProductEntry> getTopProducts(
        @RequestParam(required = false) Instant fromDate,
        @RequestParam(required = false) Instant toDate,
        @RequestParam(required = false) UUID warehouseId,
        @RequestParam(defaultValue = "10") int limit
    ) {
        return topProductsUseCase.execute(fromDate, toDate, warehouseId, limit);
    }

    @GetMapping("/top-customers")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('reports:read')")
    public Flux<TopCustomerEntry> getTopCustomers(
        @RequestParam(required = false) Instant fromDate,
        @RequestParam(required = false) Instant toDate,
        @RequestParam(required = false) UUID warehouseId,
        @RequestParam(defaultValue = "10") int limit
    ) {
        return topCustomersUseCase.execute(fromDate, toDate, warehouseId, limit);
    }

    @GetMapping("/profit-summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('reports:read')")
    public Mono<ProfitSummaryResponse> getProfitSummary(
        @RequestParam(required = false) Instant fromDate,
        @RequestParam(required = false) Instant toDate,
        @RequestParam(required = false) UUID warehouseId
    ) {
        return profitSummaryUseCase.execute(fromDate, toDate, warehouseId);
    }

    @GetMapping("/inventory-value")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('reports:read')")
    public Mono<InventoryValueResponse> getInventoryValue() {
        return inventoryValueUseCase.execute();
    }
}
