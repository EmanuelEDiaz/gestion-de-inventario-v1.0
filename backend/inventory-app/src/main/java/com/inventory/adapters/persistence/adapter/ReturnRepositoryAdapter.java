package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.ReturnLineEntity;
import com.inventory.adapters.persistence.adapter.mapper.ReturnEntityMapper;
import com.inventory.adapters.persistence.adapter.repository.R2dbcReturnLineRepository;
import com.inventory.adapters.persistence.adapter.repository.R2dbcReturnRepository;
import com.inventory.domain.model.returns.Return;
import com.inventory.domain.model.returns.ReturnLine;
import com.inventory.domain.ports.out.ReturnRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Adapter: Implementación del puerto ReturnRepository usando R2DBC.
 */
@Repository
public class ReturnRepositoryAdapter implements ReturnRepository {

    private final R2dbcReturnRepository returnRepo;
    private final R2dbcReturnLineRepository lineRepo;
    private final ReturnEntityMapper mapper;

    public ReturnRepositoryAdapter(R2dbcReturnRepository returnRepo,
                                    R2dbcReturnLineRepository lineRepo,
                                    ReturnEntityMapper mapper) {
        this.returnRepo = returnRepo;
        this.lineRepo = lineRepo;
        this.mapper = mapper;
    }

    @Override
    public Mono<Return> save(Return returnEntity) {
        var entity = mapper.toEntity(returnEntity);
        return returnRepo.save(entity)
                .flatMap(saved -> saveLines(returnEntity.getLines(), saved.getId())
                        .thenMany(lineRepo.findByReturnIdOrderBySortOrder(saved.getId()))
                        .map(mapper::toLineDomain)
                        .collectList()
                        .map(lines -> mapper.toDomain(saved, lines)));
    }

    private Flux<ReturnLineEntity> saveLines(java.util.List<ReturnLine> lines, UUID returnId) {
        return Flux.fromIterable(lines)
                .map(line -> mapper.toLineEntity(line, returnId))
                .flatMap(lineRepo::save);
    }

    @Override
    public Mono<Return> findById(UUID id) {
        return returnRepo.findById(id).flatMap(this::loadWithLines);
    }

    @Override
    public Flux<Return> findAll() {
        return returnRepo.findAll().flatMap(this::loadWithLines);
    }

    @Override
    public Flux<Return> findByWarehouseId(UUID warehouseId) {
        return returnRepo.findByWarehouseId(warehouseId).flatMap(this::loadWithLines);
    }

    @Override
    public Flux<Return> findByType(Return.ReturnType type) {
        return returnRepo.findByType(type.name()).flatMap(this::loadWithLines);
    }

    @Override
    public Flux<Return> findByStatus(Return.ReturnStatus status) {
        return returnRepo.findByStatus(status.name()).flatMap(this::loadWithLines);
    }

    @Override
    public Flux<Return> findByReturnDateBetween(LocalDate from, LocalDate to) {
        return returnRepo.findByReturnDateBetween(from, to).flatMap(this::loadWithLines);
    }

    @Override
    public Mono<Void> deleteById(UUID id) {
        return returnRepo.deleteById(id);
    }

    @Override
    public Mono<String> generateReturnNumber(Return.ReturnType type) {
        if (type == Return.ReturnType.SALE_RETURN) {
            return returnRepo.getNextSaleReturnNumber()
                    .map(seq -> String.format("RET-V-%06d", seq));
        }
        return returnRepo.getNextPurchaseReturnNumber()
                .map(seq -> String.format("RET-C-%06d", seq));
    }

    @Override
    public Flux<ReturnLine> findLinesByReturnId(UUID returnId) {
        return lineRepo.findByReturnIdOrderBySortOrder(returnId).map(mapper::toLineDomain);
    }

    @Override
    public Mono<Void> deleteLinesByReturnId(UUID returnId) {
        return lineRepo.deleteByReturnId(returnId);
    }

    private Mono<Return> loadWithLines(com.inventory.adapters.persistence.adapter.entity.ReturnEntity entity) {
        return lineRepo.findByReturnIdOrderBySortOrder(entity.getId())
                .map(mapper::toLineDomain)
                .collectList()
                .map(lines -> mapper.toDomain(entity, lines));
    }
}
