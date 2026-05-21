package com.inventory.application.usecase.query.adjustment;

import com.inventory.domain.model.adjustment.Adjustment;
import com.inventory.domain.ports.in.adjustment.AdjustmentQueryPort;
import com.inventory.domain.ports.out.AdjustmentRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Caso de uso: Consultas de ajustes de inventario.
 * Solo operaciones de lectura.
 */
@Service
public class AdjustmentQueryUseCase implements AdjustmentQueryPort {

    private final AdjustmentRepository adjustmentRepository;

    public AdjustmentQueryUseCase(AdjustmentRepository adjustmentRepository) {
        this.adjustmentRepository = adjustmentRepository;
    }

    @Override
    public Mono<Adjustment> findById(UUID id) {
        return adjustmentRepository.findById(id);
    }

    @Override
    public Flux<Adjustment> findAll() {
        return adjustmentRepository.findAll();
    }

    @Override
    public Flux<Adjustment> findByWarehouse(UUID warehouseId) {
        return adjustmentRepository.findByWarehouseId(warehouseId);
    }

    @Override
    public Flux<Adjustment> findByStatus(Adjustment.AdjustmentStatus status) {
        return adjustmentRepository.findByStatus(status);
    }

    @Override
    public Flux<Adjustment> findByType(Adjustment.AdjustmentType type) {
        return adjustmentRepository.findByType(type);
    }

    @Override
    public Flux<Adjustment> findByDateRange(LocalDate from, LocalDate to) {
        return adjustmentRepository.findByAdjustmentDateBetween(from, to);
    }
}
