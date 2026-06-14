package com.inventory.application.usecase.query.report;

import com.inventory.application.dto.report.ProfitSummaryResponse;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
public class ProfitSummaryUseCase {

    private final DatabaseClient db;

    public ProfitSummaryUseCase(DatabaseClient db) {
        this.db = db;
    }

    public Mono<ProfitSummaryResponse> execute(Instant fromDate, Instant toDate, UUID warehouseId) {
        var spec = db.sql("""
            SELECT
                COALESCE(SUM(s.total), 0) AS total_revenue,
                COALESCE(SUM(sl.total_cost), 0) AS total_cost,
                COALESCE(SUM(s.total - COALESCE(sl.total_cost, 0)), 0) AS total_profit,
                CASE WHEN COALESCE(SUM(s.total), 0) > 0
                    THEN ROUND((COALESCE(SUM(s.total - COALESCE(sl.total_cost, 0)), 0) * 100.0 / SUM(s.total)), 1)
                    ELSE 0
                END AS profit_margin,
                COUNT(DISTINCT s.id) AS sales_count,
                CASE WHEN COUNT(DISTINCT s.id) > 0
                    THEN COALESCE(SUM(s.total), 0) / COUNT(DISTINCT s.id)
                    ELSE 0
                END AS avg_sale_value
            FROM sales s
            LEFT JOIN (
                SELECT sale_id, SUM(unit_cost * quantity) AS total_cost
                FROM sale_lines
                WHERE unit_cost IS NOT NULL
                GROUP BY sale_id
            ) sl ON sl.sale_id = s.id
            WHERE s.created_at BETWEEN $1 AND $2
              AND ($3::uuid IS NULL OR s.warehouse_id = $3)
              AND s.status NOT IN ('CANCELLED', 'VOIDED')
            """)
            .bind(0, fromDate != null ? fromDate : Instant.EPOCH)
            .bind(1, toDate != null ? toDate : Instant.now());

        if (warehouseId != null) {
            spec = spec.bind(2, warehouseId);
        } else {
            spec = spec.bindNull(2, UUID.class);
        }

        return spec.fetch().first().map(row -> new ProfitSummaryResponse(
                (BigDecimal) row.get("total_revenue"),
                (BigDecimal) row.get("total_cost"),
                (BigDecimal) row.get("total_profit"),
                (BigDecimal) row.get("profit_margin"),
                ((Number) row.get("sales_count")).longValue(),
                (BigDecimal) row.get("avg_sale_value")
            ));
    }
}
