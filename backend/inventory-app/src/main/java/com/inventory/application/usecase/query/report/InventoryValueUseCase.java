package com.inventory.application.usecase.query.report;

import com.inventory.application.dto.report.InventoryValueResponse;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;

@Service
public class InventoryValueUseCase {

    private final DatabaseClient db;

    public InventoryValueUseCase(DatabaseClient db) {
        this.db = db;
    }

    public Mono<InventoryValueResponse> execute() {
        return db.sql("""
            SELECT
                COALESCE(SUM(sb.on_hand * COALESCE(sb.avg_cost, 0)), 0) AS total_value,
                COALESCE(SUM(sb.on_hand * COALESCE(p.cost, 0)), 0) AS total_cost,
                COUNT(DISTINCT p.id) AS product_count,
                CASE WHEN COUNT(DISTINCT p.id) > 0
                    THEN COALESCE(SUM(sb.on_hand * COALESCE(sb.avg_cost, 0)), 0) / COUNT(DISTINCT p.id)
                    ELSE 0
                END AS avg_cost,
                COUNT(DISTINCT CASE
                    WHEN COALESCE(sb.on_hand, 0) > 0
                     AND COALESCE(sb.on_hand, 0) <= COALESCE(p.reorder_point, 0)
                    THEN p.id
                END) AS low_stock_count
            FROM products p
            LEFT JOIN stock_balances sb ON sb.product_id = p.id
            WHERE p.status = 'ACTIVE'
            """)
            .fetch()
            .first()
            .map(row -> new InventoryValueResponse(
                (BigDecimal) row.get("total_value"),
                (BigDecimal) row.get("total_cost"),
                ((Number) row.get("product_count")).longValue(),
                (BigDecimal) row.get("avg_cost"),
                ((Number) row.get("low_stock_count")).longValue()
            ));
    }
}
