package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.AdjustmentLineEntity;
import com.inventory.adapters.persistence.adapter.mapper.AdjustmentEntityMapper;
import com.inventory.adapters.persistence.adapter.repository.R2dbcAdjustmentLineRepository;
import com.inventory.adapters.persistence.adapter.repository.R2dbcAdjustmentRepository;
import com.inventory.domain.model.adjustment.Adjustment;
import com.inventory.domain.model.adjustment.AdjustmentLine;
import com.inventory.domain.ports.out.AdjustmentRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Adapter: Implementación del puerto AdjustmentRepository usando R2DBC.
 */
@Repository
public class AdjustmentRepositoryAdapter implements AdjustmentRepository {

    private final R2dbcAdjustmentRepository adjustmentRepo;
    private final R2dbcAdjustmentLineRepository lineRepo;
    private final AdjustmentEntityMapper mapper;

    public AdjustmentRepositoryAdapter(R2dbcAdjustmentRepository adjustmentRepo,
                                        R2dbcAdjustmentLineRepository lineRepo,
                                        AdjustmentEntityMapper mapper) {
        this.adjustmentRepo = adjustmentRepo;
        this.lineRepo = lineRepo;
        this.mapper = mapper;
    }

    @Override
    public Mono<Adjustment> save(Adjustment adjustment) {
        var entity = mapper.toEntity(adjustment);
        return adjustmentRepo.save(entity)
                .flatMap(saved -> saveLines(adjustment.getLines(), saved.getId())
                        .thenMany(lineRepo.findByAdjustmentIdOrderBySortOrder(saved.getId()))
                        .map(mapper::toLineDomain)
                        .collectList()
                        .map(lines -> mapper.toDomain(saved, lines)));
    }

    private Flux<AdjustmentLineEntity> saveLines(java.util.List<AdjustmentLine> lines, UUID adjustmentId) {
        return Flux.fromIterable(lines)
                .map(line -> mapper.toLineEntity(line, adjustmentId))
                .flatMap(lineRepo::save);
    }

    @Override
    public Mono<Adjustment> findById(UUID id) {
        return adjustmentRepo.findById(id)
                .flatMap(this::loadWithLines);
    }

    @Override
    public Flux<Adjustment> findAll() {
        return adjustmentRepo.findAll()
                .flatMap(this::loadWithLines);
    }

    @Override
    public Flux<Adjustment> findByWarehouseId(UUID warehouseId) {
        return adjustmentRepo.findByWarehouseId(warehouseId)
                .flatMap(this::loadWithLines);
    }

    @Override
    public Flux<Adjustment> findByStatus(Adjustment.AdjustmentStatus status) {
        return adjustmentRepo.findByStatus(status.name())
                .flatMap(this::loadWithLines);
    }

    @Override
    public Flux<Adjustment> findByType(Adjustment.AdjustmentType type) {
        return adjustmentRepo.findByType(type.name())
                .flatMap(this::loadWithLines);
    }

    @Override
    public Flux<Adjustment> findByAdjustmentDateBetween(LocalDate from, LocalDate to) {
        return adjustmentRepo.findByAdjustmentDateBetween(from, to)
                .flatMap(this::loadWithLines);
    }

    @Override
    public Mono<Void> deleteById(UUID id) {
        return deleteLinesByAdjustmentId(id).then(adjustmentRepo.deleteById(id));
    }

    @Override
    public Mono<Void> deleteAllById(List<UUID> ids) {
        if (ids.isEmpty()) return Mono.empty();
        return Flux.fromIterable(ids)
                .flatMap(id -> deleteLinesByAdjustmentId(id).then(adjustmentRepo.deleteById(id)))
                .then();
    }

    @Override
    public Mono<String> generateAdjustmentNumber() {
        return adjustmentRepo.getNextNumber()
                .map(seq -> String.format("ADJ-%06d", seq));
    }

    @Override
    public Flux<AdjustmentLine> findLinesByAdjustmentId(UUID adjustmentId) {
        return lineRepo.findByAdjustmentIdOrderBySortOrder(adjustmentId)
                .map(mapper::toLineDomain);
    }

    @Override
    public Mono<Void> deleteLinesByAdjustmentId(UUID adjustmentId) {
        return lineRepo.deleteByAdjustmentId(adjustmentId);
    }

    private Mono<Adjustment> loadWithLines(com.inventory.adapters.persistence.adapter.entity.AdjustmentEntity entity) {
        return lineRepo.findByAdjustmentIdOrderBySortOrder(entity.getId())
                .map(mapper::toLineDomain)
                .collectList()
                .map(lines -> mapper.toDomain(entity, lines));
    }
}
