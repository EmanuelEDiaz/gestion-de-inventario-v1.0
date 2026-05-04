package com.inventory.domain.ports.in;

import com.inventory.domain.model.Adjustment;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Puerto de entrada para consultas de ajustes de inventario.
 * Operaciones de solo lectura.
 */
public interface AdjustmentQueryPort {
    
    Mono<Adjustment> findById(UUID id);
    Flux<Adjustment> findAll();
    Flux<Adjustment> findByWarehouse(UUID warehouseId);
    Flux<Adjustment> findByStatus(Adjustment.AdjustmentStatus status);
    Flux<Adjustment> findByType(Adjustment.AdjustmentType type);
    Flux<Adjustment> findByDateRange(LocalDate from, LocalDate to);
}
