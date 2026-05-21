package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.entity.StockBalanceEntity;
import com.inventory.adapters.persistence.mapper.StockBalanceEntityMapper;
import com.inventory.adapters.persistence.repository.R2dbcStockBalanceRepository;
import com.inventory.domain.model.stock.StockBalance;
import com.inventory.domain.ports.out.StockRepository;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

@Component
public class StockRepositoryAdapter implements StockRepository {

    private final R2dbcStockBalanceRepository r2dbcRepo;
    private final StockBalanceEntityMapper mapper;

    public StockRepositoryAdapter(R2dbcStockBalanceRepository r2dbcRepo, StockBalanceEntityMapper mapper) {
        this.r2dbcRepo = r2dbcRepo;
        this.mapper = mapper;
    }

    @Override
    public Mono<StockBalance> findById(UUID warehouseId, UUID productId) {
        return r2dbcRepo.findByWarehouseIdAndProductId(warehouseId, productId)
                .map(mapper::toDomain);
    }

    @Override
    public Flux<StockBalance> findByWarehouseId(UUID warehouseId) {
        return r2dbcRepo.findByWarehouseId(warehouseId)
                .map(mapper::toDomain);
    }

    @Override
    public Flux<StockBalance> findByProductId(UUID productId) {
        return r2dbcRepo.findByProductId(productId)
                .map(mapper::toDomain);
    }

    @Override
    public Flux<StockBalance> findAll(int page, int size) {
        int offset = page * size;
        return r2dbcRepo.findAllPaginated(size, offset)
                .map(mapper::toDomain);
    }

    @Override
    public Flux<StockBalance> findBelowReorderPoint() {
        return r2dbcRepo.findBelowReorderPoint()
                .map(mapper::toDomain);
    }

    @Override
    public Flux<StockBalance> findOutOfStock() {
        return r2dbcRepo.findOutOfStock()
                .map(mapper::toDomain);
    }

    @Override
    public Mono<StockBalance> save(StockBalance balance) {
        return r2dbcRepo.upsert(
            balance.getWarehouseId(),
            balance.getProductId(),
            balance.getOnHand(),
            balance.getReserved(),
            balance.getAvgCost()
        ).map(mapper::toDomain);
    }

    @Override
    public Mono<StockBalance> addStock(UUID warehouseId, UUID productId, BigDecimal quantity, BigDecimal unitCost) {
        return findById(warehouseId, productId)
                .defaultIfEmpty(StockBalance.empty(warehouseId, productId))
                .flatMap(balance -> {
                    StockBalance updated = balance.addStock(quantity, unitCost);
                    return save(updated);
                });
    }

    @Override
    public Mono<StockBalance> removeStock(UUID warehouseId, UUID productId, BigDecimal quantity) {
        return findById(warehouseId, productId)
                .flatMap(balance -> {
                    StockBalance updated = balance.removeStock(quantity);
                    return save(updated);
                });
    }

    @Override
    public Mono<StockBalance> reserveStock(UUID warehouseId, UUID productId, BigDecimal quantity) {
        return findById(warehouseId, productId)
                .flatMap(balance -> {
                    StockBalance updated = balance.reserve(quantity);
                    return save(updated);
                });
    }

    @Override
    public Mono<StockBalance> releaseReservation(UUID warehouseId, UUID productId, BigDecimal quantity) {
        return findById(warehouseId, productId)
                .flatMap(balance -> {
                    StockBalance updated = balance.unreserve(quantity);
                    return save(updated);
                });
    }

    @Override
    public Mono<Boolean> hasAvailableStock(UUID warehouseId, UUID productId, BigDecimal quantity) {
        return findById(warehouseId, productId)
                .map(balance -> balance.hasAvailable(quantity))
                .defaultIfEmpty(false);
    }
}
