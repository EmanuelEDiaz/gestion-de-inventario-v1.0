package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.StockBalanceEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public interface R2dbcStockBalanceRepository extends ReactiveCrudRepository<StockBalanceEntity, UUID> {

    @Query("SELECT * FROM stock_balances WHERE warehouse_id = :warehouseId AND product_id = :productId")
    Mono<StockBalanceEntity> findByWarehouseIdAndProductId(UUID warehouseId, UUID productId);

    Flux<StockBalanceEntity> findByWarehouseId(UUID warehouseId);

    Flux<StockBalanceEntity> findByProductId(UUID productId);

    @Query("SELECT * FROM stock_balances LIMIT :size OFFSET :offset")
    Flux<StockBalanceEntity> findAllPaginated(int size, int offset);

    @Query("""
        SELECT sb.* FROM stock_balances sb
        JOIN products p ON sb.product_id = p.id
        WHERE p.reorder_point IS NOT NULL AND sb.on_hand < p.reorder_point
        """)
    Flux<StockBalanceEntity> findBelowReorderPoint();

    @Query("SELECT * FROM stock_balances WHERE on_hand <= 0")
    Flux<StockBalanceEntity> findOutOfStock();

    @Query("""
        INSERT INTO stock_balances (warehouse_id, product_id, on_hand, reserved, avg_cost, updated_at)
        VALUES (:warehouseId, :productId, :onHand, :reserved, :avgCost, NOW())
        ON CONFLICT (warehouse_id, product_id)
        DO UPDATE SET on_hand = EXCLUDED.on_hand, reserved = EXCLUDED.reserved, 
                      avg_cost = EXCLUDED.avg_cost, updated_at = NOW()
        RETURNING *
        """)
    Mono<StockBalanceEntity> upsert(UUID warehouseId, UUID productId, 
                                     java.math.BigDecimal onHand, java.math.BigDecimal reserved, 
                                     java.math.BigDecimal avgCost);
}
