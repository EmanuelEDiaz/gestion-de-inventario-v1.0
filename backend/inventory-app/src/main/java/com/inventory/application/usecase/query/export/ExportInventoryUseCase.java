package com.inventory.application.usecase.query.export;

import com.inventory.application.dto.export.ExportInventoryRow;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class ExportInventoryUseCase {

    private final DatabaseClient db;

    public ExportInventoryUseCase(DatabaseClient db) {
        this.db = db;
    }

    public Flux<ExportInventoryRow> execute(UUID warehouseId, UUID categoryId) {
        return db.sql("""
            SELECT
                COALESCE(p.sku, '') AS code,
                p.name AS product,
                COALESCE(cat.name, '') AS category,
                COALESCE(w.name, '') AS warehouse,
                COALESCE(sb.on_hand, 0) AS stock,
                COALESCE(sb.avg_cost, 0) AS unit_cost,
                COALESCE(sb.on_hand * COALESCE(sb.avg_cost, 0), 0) AS total_value
            FROM products p
            LEFT JOIN categories cat ON cat.id = p.category_id
            LEFT JOIN stock_balances sb ON sb.product_id = p.id
                AND ($1::uuid IS NULL OR sb.warehouse_id = $1)
            LEFT JOIN warehouses w ON w.id = COALESCE(sb.warehouse_id, $1)
            WHERE p.status = 'ACTIVE'
              AND ($2::uuid IS NULL OR p.category_id = $2)
            ORDER BY p.name ASC
            """)
            .bind(0, warehouseId)
            .bind(1, categoryId)
            .fetch()
            .all()
            .map(row -> new ExportInventoryRow(
                (String) row.get("code"),
                (String) row.get("product"),
                (String) row.get("category"),
                (String) row.get("warehouse"),
                (BigDecimal) row.get("stock"),
                (BigDecimal) row.get("unit_cost"),
                (BigDecimal) row.get("total_value")
            ));
    }
}
