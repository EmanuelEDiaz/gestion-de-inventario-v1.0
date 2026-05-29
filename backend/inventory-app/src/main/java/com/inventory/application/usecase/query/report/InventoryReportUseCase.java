package com.inventory.application.usecase.query.report;

import com.inventory.adapters.web.dto.report.InventoryReportResponse;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class InventoryReportUseCase {

    private final DatabaseClient db;

    public InventoryReportUseCase(DatabaseClient db) {
        this.db = db;
    }

    public Mono<InventoryReportResponse> execute(UUID warehouseId, UUID categoryId) {
        return db.sql("""
            SELECT
                COUNT(DISTINCT p.id) AS total_products,
                COALESCE(SUM(sb.on_hand * COALESCE(sb.avg_cost, 0)), 0) AS total_value,
                COUNT(DISTINCT CASE
                    WHEN COALESCE(sb.on_hand, 0) > 0
                     AND COALESCE(sb.on_hand, 0) <= COALESCE(p.reorder_point, 0)
                    THEN p.id
                END) AS low_stock_count,
                COUNT(DISTINCT CASE
                    WHEN COALESCE(sb.on_hand, 0) = 0
                    THEN p.id
                END) AS out_of_stock_count
            FROM products p
            LEFT JOIN stock_balances sb ON sb.product_id = p.id
                AND ($1::uuid IS NULL OR sb.warehouse_id = $1)
            WHERE p.status = 'ACTIVE'
              AND ($2::uuid IS NULL OR p.category_id = $2)
            """)
            .bind(0, warehouseId)
            .bind(1, categoryId)
            .fetch()
            .first()
            .map(row -> new InventoryReportResponse(
                ((Number) row.get("total_products")).longValue(),
                (BigDecimal) row.get("total_value"),
                ((Number) row.get("low_stock_count")).longValue(),
                ((Number) row.get("out_of_stock_count")).longValue()
            ));
    }
}
