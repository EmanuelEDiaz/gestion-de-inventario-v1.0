package com.inventory.application.usecase.query.sync;

import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class SyncChecksumUseCase {

    private final DatabaseClient db;

    public SyncChecksumUseCase(DatabaseClient db) {
        this.db = db;
    }

    public record StoreChecksum(long count, long checksum) {}

    public Mono<Map<String, StoreChecksum>> computeChecksums() {
        var tables = new String[]{
            "products", "categories", "customers",
            "suppliers", "warehouses", "stock_balances"
        };

        return Mono.zip(
            checksum(tables[0]),
            checksum(tables[1]),
            checksum(tables[2]),
            checksum(tables[3]),
            checksum(tables[4]),
            checksum(tables[5])
        ).map(tuple -> {
            var map = new LinkedHashMap<String, StoreChecksum>();
            map.put(tables[0], tuple.getT1());
            map.put(tables[1], tuple.getT2());
            map.put(tables[2], tuple.getT3());
            map.put(tables[3], tuple.getT4());
            map.put(tables[4], tuple.getT5());
            map.put(tables[5], tuple.getT6());
            return map;
        });
    }

    private Mono<StoreChecksum> checksum(String table) {
        return db.sql("""
            SELECT COUNT(*) AS count,
                   COALESCE(MAX(EXTRACT(EPOCH FROM updated_at) * 1000)::BIGINT, 0) AS checksum
            FROM %s
            """.formatted(table))
            .fetch()
            .first()
            .map(row -> new StoreChecksum(
                ((Number) row.get("count")).longValue(),
                ((Number) row.get("checksum")).longValue()
            ));
    }
}
