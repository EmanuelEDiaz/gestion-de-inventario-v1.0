package com.inventory.domain.ports.out;

import com.inventory.domain.model.adjustment.Adjustment;
import com.inventory.domain.model.adjustment.AdjustmentLine;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Puerto de salida para persistencia de ajustes.
 * Contrato que debe implementar el adapter de persistencia.
 */
public interface AdjustmentRepository {
    
    Mono<Adjustment> save(Adjustment adjustment);
    Mono<Adjustment> findById(UUID id);
    Flux<Adjustment> findAll();
    Flux<Adjustment> findByWarehouseId(UUID warehouseId);
    Flux<Adjustment> findByStatus(Adjustment.AdjustmentStatus status);
    Flux<Adjustment> findByType(Adjustment.AdjustmentType type);
    Flux<Adjustment> findByAdjustmentDateBetween(LocalDate from, LocalDate to);
    Mono<Void> deleteById(UUID id);
    Mono<Void> deleteAllById(List<UUID> ids);
    Mono<String> generateAdjustmentNumber();

    // Líneas
    Flux<AdjustmentLine> findLinesByAdjustmentId(UUID adjustmentId);
    Mono<Void> deleteLinesByAdjustmentId(UUID adjustmentId);
}
