package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.mapper.InventoryMovementEntityMapper;
import com.inventory.adapters.persistence.repository.R2dbcMovementRepository;
import com.inventory.domain.model.stock.InventoryMovement;
import com.inventory.domain.ports.out.MovementRepository;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

@Component
public class MovementRepositoryAdapter implements MovementRepository {

    private final R2dbcMovementRepository r2dbcRepo;
    private final InventoryMovementEntityMapper mapper;

    public MovementRepositoryAdapter(R2dbcMovementRepository r2dbcRepo, InventoryMovementEntityMapper mapper) {
        this.r2dbcRepo = r2dbcRepo;
        this.mapper = mapper;
    }

    @Override
    public Mono<InventoryMovement> findById(UUID id) {
        return r2dbcRepo.findById(id)
                .map(mapper::toDomain);
    }

    @Override
    public Flux<InventoryMovement> findByWarehouseId(UUID warehouseId) {
        return r2dbcRepo.findByWarehouseId(warehouseId)
                .map(mapper::toDomain);
    }

    @Override
    public Flux<InventoryMovement> findByProductId(UUID productId) {
        return r2dbcRepo.findByProductId(productId)
                .map(mapper::toDomain);
    }

    @Override
    public Flux<InventoryMovement> findByWarehouseIdAndProductId(UUID warehouseId, UUID productId) {
        return r2dbcRepo.findByWarehouseIdAndProductId(warehouseId, productId)
                .map(mapper::toDomain);
    }

    @Override
    public Flux<InventoryMovement> findByMovementType(InventoryMovement.MovementType movementType) {
        return r2dbcRepo.findByMovementType(movementType.name())
                .map(mapper::toDomain);
    }

    @Override
    public Flux<InventoryMovement> findBySourceDocument(String sourceDocType, UUID sourceDocId) {
        return r2dbcRepo.findBySourceDocument(sourceDocType, sourceDocId)
                .map(mapper::toDomain);
    }

    @Override
    public Flux<InventoryMovement> findByDateRange(Instant from, Instant to) {
        return r2dbcRepo.findByDateRange(from, to)
                .map(mapper::toDomain);
    }

    @Override
    public Flux<InventoryMovement> findAllPaginated(int page, int size) {
        int offset = page * size;
        return r2dbcRepo.findAllPaginated(size, offset)
                .map(mapper::toDomain);
    }

    @Override
    public Mono<InventoryMovement> save(InventoryMovement movement) {
        return r2dbcRepo.save(mapper.toEntity(movement))
                .map(mapper::toDomain);
    }

    @Override
    public Mono<Long> count() {
        return r2dbcRepo.count();
    }

    @Override
    public Mono<Long> countByMovementType(InventoryMovement.MovementType movementType) {
        return r2dbcRepo.countByMovementType(movementType.name());
    }
}
