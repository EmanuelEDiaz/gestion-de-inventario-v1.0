package com.inventory.adapters.web.controller;

import com.inventory.application.supplier.dto.AddCatalogProductRequest;
import com.inventory.application.supplier.dto.SupplierCatalogProductDto;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.ports.in.supplier.SupplierCatalogProductCommandPort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/suppliers/{supplierId}/catalog")
public class SupplierCatalogProductController {

    private final SupplierCatalogProductCommandPort commandPort;
    private final SupplementaryApplicationMapper mapper;

    public SupplierCatalogProductController(SupplierCatalogProductCommandPort commandPort,
                                            SupplementaryApplicationMapper mapper) {
        this.commandPort = commandPort;
        this.mapper = mapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER')")
    public Flux<SupplierCatalogProductDto> list(@PathVariable UUID supplierId) {
        return commandPort.listBySupplierId(supplierId).map(mapper::toDto);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<SupplierCatalogProductDto> add(
        @PathVariable UUID supplierId,
        @RequestBody AddCatalogProductRequest request
    ) {
        return commandPort.add(new SupplierCatalogProductCommandPort.AddCommand(
            supplierId,
            request.productId(),
            request.description(),
            request.unitPrice(),
            request.currencyCode()
        )).map(mapper::toDto);
    }

    @DeleteMapping("/{catalogProductId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<Void> delete(
        @PathVariable UUID supplierId,
        @PathVariable UUID catalogProductId
    ) {
        return commandPort.delete(catalogProductId);
    }
}
