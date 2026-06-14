package com.inventory.application.usecase.query.report;

import com.inventory.application.dto.report.TopCustomerEntry;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
public class TopCustomersUseCase {

    private final DatabaseClient db;

    public TopCustomersUseCase(DatabaseClient db) {
        this.db = db;
    }

    public Flux<TopCustomerEntry> execute(Instant fromDate, Instant toDate, UUID warehouseId, int limit) {
        var spec = db.sql("""
            SELECT c.id AS customer_id, c.name AS customer_name,
                COUNT(DISTINCT s.id) AS total_purchases,
                COALESCE(SUM(s.total), 0) AS total_revenue,
                COALESCE(cd.balance, 0) AS debt_balance
            FROM sales s
            JOIN customers c ON c.id = s.customer_id
            LEFT JOIN customer_debts cd ON cd.customer_id = c.id AND cd.status != 'PAID'
            WHERE s.created_at BETWEEN $1 AND $2
              AND ($3::uuid IS NULL OR s.warehouse_id = $3)
              AND s.status NOT IN ('CANCELLED', 'VOIDED')
            GROUP BY c.id, c.name, cd.balance
            ORDER BY total_revenue DESC
            LIMIT $4
            """)
            .bind(0, fromDate != null ? fromDate : Instant.EPOCH)
            .bind(1, toDate != null ? toDate : Instant.now());

        if (warehouseId != null) {
            spec = spec.bind(2, warehouseId);
        } else {
            spec = spec.bindNull(2, UUID.class);
        }

        return spec.bind(3, limit).fetch().all().map(row -> new TopCustomerEntry(
                (UUID) row.get("customer_id"),
                (String) row.get("customer_name"),
                ((Number) row.get("total_purchases")).longValue(),
                (BigDecimal) row.get("total_revenue"),
                (BigDecimal) row.get("debt_balance")
            ));
    }
}
