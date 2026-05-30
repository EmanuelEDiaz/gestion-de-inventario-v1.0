package com.inventory.adapters.web.controller.stock;

import com.inventory.application.stock.dto.MovementDto;
import com.inventory.application.mapper.MovementMapper;
import com.inventory.domain.model.stock.InventoryMovement;
import com.inventory.domain.ports.in.stock.MovementQueryPort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

/**
 * Controller REST para consultas de Movimientos de Inventario.
 */
@RestController
@RequestMapping("/api/v1/movements")
public class MovementController {

    private final MovementQueryPort movementQueryPort;
    private final MovementMapper mapper;

    public MovementController(MovementQueryPort movementQueryPort, MovementMapper mapper) {
        this.movementQueryPort = movementQueryPort;
        this.mapper = mapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('stock:read')")
    public Flux<MovementDto> getAll(
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) String movementType,
            @RequestParam(required = false) String sourceDocType,
            @RequestParam(required = false) Instant fromDate,
            @RequestParam(required = false) Instant toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        InventoryMovement.MovementType type = null;
        if (movementType != null && !movementType.isBlank()) {
            type = InventoryMovement.MovementType.valueOf(movementType);
        }
        
        MovementQueryPort.MovementFilter filter = new MovementQueryPort.MovementFilter(
            warehouseId, productId, type, sourceDocType, fromDate, toDate, page, size
        );
        
        return movementQueryPort.findAll(filter)
                .map(mapper::toDto);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('stock:read')")
    public Mono<MovementDto> getById(@PathVariable UUID id) {
        return movementQueryPort.findById(id)
                .map(mapper::toDto);
    }

    @GetMapping("/warehouse/{warehouseId}/product/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('stock:read')")
    public Flux<MovementDto> getByWarehouseAndProduct(
            @PathVariable UUID warehouseId,
            @PathVariable UUID productId) {
        
        return movementQueryPort.findByWarehouseAndProduct(warehouseId, productId)
                .map(mapper::toDto);
    }

    @GetMapping("/document/{docType}/{docId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('stock:read')")
    public Flux<MovementDto> getByDocument(
            @PathVariable String docType,
            @PathVariable UUID docId) {
        
        return movementQueryPort.findBySourceDocument(docType, docId)
                .map(mapper::toDto);
    }

    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('stock:read')")
    public Mono<Long> count(
            @RequestParam(required = false) String movementType) {
        
        InventoryMovement.MovementType type = null;
        if (movementType != null && !movementType.isBlank()) {
            type = InventoryMovement.MovementType.valueOf(movementType);
        }
        
        MovementQueryPort.MovementFilter filter = new MovementQueryPort.MovementFilter(
            null, null, type, null, null, null, 0, 0
        );
        
        return movementQueryPort.count(filter);
    }
}
