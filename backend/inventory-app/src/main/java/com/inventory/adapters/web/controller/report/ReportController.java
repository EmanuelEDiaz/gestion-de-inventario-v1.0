package com.inventory.adapters.web.controller.report;

import com.inventory.adapters.web.dto.report.InventoryReportResponse;
import com.inventory.adapters.web.dto.report.SalesReportResponse;
import com.inventory.application.usecase.query.report.InventoryReportUseCase;
import com.inventory.application.usecase.query.report.SalesReportUseCase;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final SalesReportUseCase salesReportUseCase;
    private final InventoryReportUseCase inventoryReportUseCase;

    public ReportController(SalesReportUseCase salesReportUseCase,
                            InventoryReportUseCase inventoryReportUseCase) {
        this.salesReportUseCase = salesReportUseCase;
        this.inventoryReportUseCase = inventoryReportUseCase;
    }

    @GetMapping("/sales")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<SalesReportResponse> getSalesReport(
        @RequestParam(required = false) Instant fromDate,
        @RequestParam(required = false) Instant toDate,
        @RequestParam(required = false) UUID warehouseId
    ) {
        return salesReportUseCase.execute(fromDate, toDate, warehouseId);
    }

    @GetMapping("/inventory")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<InventoryReportResponse> getInventoryReport(
        @RequestParam(required = false) UUID warehouseId,
        @RequestParam(required = false) UUID categoryId
    ) {
        return inventoryReportUseCase.execute(warehouseId, categoryId);
    }
}
