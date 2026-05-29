package com.inventory.application.usecase.query.export;

import com.inventory.application.dto.export.ExportSalesRow;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
public class ExportSalesUseCase {

    private final DatabaseClient db;

    public ExportSalesUseCase(DatabaseClient db) {
        this.db = db;
    }

    public Flux<ExportSalesRow> execute(Instant fromDate, Instant toDate, UUID warehouseId) {
        return db.sql("""
            SELECT
                TO_CHAR(s.sale_date, 'YYYY-MM-DD') AS date,
                s.sale_number AS invoice_number,
                COALESCE(c.name, '') AS customer_name,
                s.total,
                COALESCE(sl.total_cost, 0) AS cost,
                s.total - COALESCE(sl.total_cost, 0) AS profit,
                COALESCE(s.payment_method, '') AS payment_mode,
                COALESCE(w.name, '') AS warehouse_name
            FROM sales s
            LEFT JOIN customers c ON c.id = s.customer_id
            LEFT JOIN warehouses w ON w.id = s.warehouse_id
            LEFT JOIN (
                SELECT sale_id, SUM(unit_cost * quantity) AS total_cost
                FROM sale_lines
                WHERE unit_cost IS NOT NULL
                GROUP BY sale_id
            ) sl ON sl.sale_id = s.id
            WHERE s.created_at BETWEEN $1 AND $2
              AND ($3::uuid IS NULL OR s.warehouse_id = $3)
              AND s.status NOT IN ('CANCELLED', 'VOIDED')
            ORDER BY s.sale_date DESC
            """)
            .bind(0, fromDate != null ? fromDate : Instant.EPOCH)
            .bind(1, toDate != null ? toDate : Instant.now())
            .bind(2, warehouseId)
            .fetch()
            .all()
            .map(row -> new ExportSalesRow(
                (String) row.get("date"),
                (String) row.get("invoice_number"),
                (String) row.get("customer_name"),
                (BigDecimal) row.get("total"),
                (BigDecimal) row.get("cost"),
                (BigDecimal) row.get("profit"),
                (String) row.get("payment_mode"),
                (String) row.get("warehouse_name")
            ));
    }
}
