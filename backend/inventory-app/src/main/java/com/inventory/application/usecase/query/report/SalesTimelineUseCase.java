package com.inventory.application.usecase.query.report;

import com.inventory.application.dto.report.SalesTimelinePoint;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
public class SalesTimelineUseCase {

    private final DatabaseClient db;

    public SalesTimelineUseCase(DatabaseClient db) {
        this.db = db;
    }

    public Flux<SalesTimelinePoint> execute(Instant fromDate, Instant toDate, UUID warehouseId, String granularity) {
        String dateExpr = switch (granularity) {
            case "day" -> "TO_CHAR(DATE_TRUNC('day', s.created_at), 'YYYY-MM-DD')";
            case "week" -> "TO_CHAR(DATE_TRUNC('week', s.created_at), 'IYYY-IW')";
            default -> "TO_CHAR(DATE_TRUNC('month', s.created_at), 'YYYY-MM')";
        };

        String groupExpr = switch (granularity) {
            case "day" -> "DATE_TRUNC('day', s.created_at)";
            case "week" -> "DATE_TRUNC('week', s.created_at)";
            default -> "DATE_TRUNC('month', s.created_at)";
        };

        var spec = db.sql(String.format("""
            SELECT
                %s AS date,
                COALESCE(SUM(s.total), 0) AS revenue,
                COALESCE(SUM(sl.total_cost), 0) AS cost,
                COALESCE(SUM(s.total - COALESCE(sl.total_cost, 0)), 0) AS profit,
                COUNT(DISTINCT s.id) AS count
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
            GROUP BY %s
            ORDER BY %s ASC
            LIMIT 365
            """, dateExpr, groupExpr, groupExpr))
            .bind(0, fromDate != null ? fromDate : Instant.EPOCH)
            .bind(1, toDate != null ? toDate : Instant.now());

        if (warehouseId != null) {
            spec = spec.bind(2, warehouseId);
        } else {
            spec = spec.bindNull(2, UUID.class);
        }

        return spec.fetch().all().map(row -> new SalesTimelinePoint(
                (String) row.get("date"),
                (BigDecimal) row.get("revenue"),
                (BigDecimal) row.get("cost"),
                (BigDecimal) row.get("profit"),
                ((Number) row.get("count")).longValue()
            ));
    }
}
