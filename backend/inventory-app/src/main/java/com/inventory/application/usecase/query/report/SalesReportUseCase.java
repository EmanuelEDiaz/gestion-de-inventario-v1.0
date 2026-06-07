package com.inventory.application.usecase.query.report;

import com.inventory.application.dto.report.SalesReportResponse;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
public class SalesReportUseCase {

    private final DatabaseClient db;

    public SalesReportUseCase(DatabaseClient db) {
        this.db = db;
    }

    public Mono<SalesReportResponse> execute(Instant fromDate, Instant toDate, UUID warehouseId) {
        return db.sql("""
            SELECT
                COALESCE(SUM(s.total), 0) AS total_revenue,
                COALESCE(SUM(sl.total_cost), 0) AS total_cost,
                COALESCE(SUM(s.total - COALESCE(sl.total_cost, 0)), 0) AS total_profit,
                COUNT(DISTINCT s.id) AS sales_count,
                COALESCE(TO_CHAR(DATE_TRUNC('month', s.created_at), 'Mon YYYY'), 'N/A') AS period
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
            GROUP BY DATE_TRUNC('month', s.created_at)
            ORDER BY DATE_TRUNC('month', s.created_at) DESC
            LIMIT 1
            """)
            .bind(0, fromDate != null ? fromDate : Instant.EPOCH)
            .bind(1, toDate != null ? toDate : Instant.now())
            .bind(2, warehouseId)
            .fetch()
            .first()
            .map(row -> new SalesReportResponse(
                (BigDecimal) row.get("total_revenue"),
                (BigDecimal) row.get("total_cost"),
                (BigDecimal) row.get("total_profit"),
                ((Number) row.get("sales_count")).longValue(),
                (String) row.get("period")
            ));
    }
}
