package com.inventory.application.usecase.query.report;

import com.inventory.application.dto.report.TopProductEntry;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
public class TopProductsUseCase {

    private final DatabaseClient db;

    public TopProductsUseCase(DatabaseClient db) {
        this.db = db;
    }

    public Flux<TopProductEntry> execute(Instant fromDate, Instant toDate, UUID warehouseId, int limit) {
        return db.sql("""
            SELECT p.id AS product_id, p.name AS product_name,
                COUNT(DISTINCT s.id) AS total_sold,
                COALESCE(SUM(sl.unit_price * sl.quantity), 0) AS total_revenue,
                COALESCE(SUM(sl.quantity), 0) AS quantity_sold
            FROM sale_lines sl
            JOIN sales s ON s.id = sl.sale_id
            JOIN products p ON p.id = sl.product_id
            WHERE s.created_at BETWEEN $1 AND $2
              AND ($3::uuid IS NULL OR s.warehouse_id = $3)
              AND s.status NOT IN ('CANCELLED', 'VOIDED')
            GROUP BY p.id, p.name
            ORDER BY total_revenue DESC
            LIMIT $4
            """)
            .bind(0, fromDate != null ? fromDate : Instant.EPOCH)
            .bind(1, toDate != null ? toDate : Instant.now())
            .bind(2, warehouseId)
            .bind(3, limit)
            .fetch()
            .all()
            .map(row -> new TopProductEntry(
                (UUID) row.get("product_id"),
                (String) row.get("product_name"),
                ((Number) row.get("total_sold")).longValue(),
                (BigDecimal) row.get("total_revenue"),
                ((Number) row.get("quantity_sold")).longValue()
            ));
    }
}
