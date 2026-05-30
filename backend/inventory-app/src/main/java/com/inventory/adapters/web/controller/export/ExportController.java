package com.inventory.adapters.web.controller.export;

import com.inventory.application.dto.export.ExportInventoryRow;
import com.inventory.application.dto.export.ExportSalesRow;
import com.inventory.application.usecase.query.export.ExportInventoryUseCase;
import com.inventory.application.usecase.query.export.ExportSalesUseCase;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/exports")
public class ExportController {

    private final ExportSalesUseCase exportSalesUseCase;
    private final ExportInventoryUseCase exportInventoryUseCase;

    public ExportController(ExportSalesUseCase exportSalesUseCase,
                            ExportInventoryUseCase exportInventoryUseCase) {
        this.exportSalesUseCase = exportSalesUseCase;
        this.exportInventoryUseCase = exportInventoryUseCase;
    }

    @GetMapping(value = "/sales", produces = "text/csv")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('exports:read')")
    public Flux<String> exportSales(
        @RequestParam(required = false) Instant fromDate,
        @RequestParam(required = false) Instant toDate,
        @RequestParam(required = false) UUID warehouseId,
        @RequestParam(defaultValue = "csv") String format,
        ServerHttpResponse response
    ) {
        if (!"csv".equalsIgnoreCase(format)) {
            return Flux.error(new ResponseStatusException(
                HttpStatus.NOT_IMPLEMENTED,
                "Formato '" + format + "' no soportado. Solo CSV disponible."));
        }
        response.getHeaders().set(HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"sales.csv\"");
        return exportSalesUseCase.execute(fromDate, toDate, warehouseId)
            .map(ExportSalesRow::toCsvLine)
            .map(line -> line + "\n")
            .startWith("fecha,factura,cliente,total,costo,ganancia,modo_pago,almacen\n");
    }

    @GetMapping(value = "/inventory", produces = "text/csv")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('exports:read')")
    public Flux<String> exportInventory(
        @RequestParam(required = false) UUID warehouseId,
        @RequestParam(required = false) UUID categoryId,
        @RequestParam(defaultValue = "csv") String format,
        ServerHttpResponse response
    ) {
        if (!"csv".equalsIgnoreCase(format)) {
            return Flux.error(new ResponseStatusException(
                HttpStatus.NOT_IMPLEMENTED,
                "Formato '" + format + "' no soportado. Solo CSV disponible."));
        }
        response.getHeaders().set(HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"inventory.csv\"");
        return exportInventoryUseCase.execute(warehouseId, categoryId)
            .map(ExportInventoryRow::toCsvLine)
            .map(line -> line + "\n")
            .startWith("codigo,producto,categoria,almacen,stock,costo_unitario,valor_total\n");
    }
}
