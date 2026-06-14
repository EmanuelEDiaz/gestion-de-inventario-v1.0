package com.inventory.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.domain.ports.out.CategoryRepository;
import com.inventory.domain.ports.out.CustomerRepository;
import com.inventory.domain.ports.out.ProductRepository;
import com.inventory.domain.ports.out.SupplierRepository;
import com.inventory.domain.ports.out.WarehouseRepository;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Component
public class CurrentEntityFetcher {

    private final Map<String, Function<UUID, Mono<?>>> fetchers = new HashMap<>();
    private final ObjectMapper objectMapper;

    public CurrentEntityFetcher(
        ProductRepository productRepo,
        CategoryRepository categoryRepo,
        CustomerRepository customerRepo,
        SupplierRepository supplierRepo,
        WarehouseRepository warehouseRepo,
        ObjectMapper objectMapper
    ) {
        this.objectMapper = objectMapper;

        fetchers.put("PRODUCT", id -> productRepo.findById(id));
        fetchers.put("CATEGORY", id -> categoryRepo.findById(id));
        fetchers.put("CUSTOMER", id -> customerRepo.findById(id));
        fetchers.put("SUPPLIER", id -> supplierRepo.findById(id));
        fetchers.put("WAREHOUSE", id -> warehouseRepo.findById(id));
    }

    public Mono<Map<String, Object>> fetchCurrent(String entityType, String entityId) {
        if (entityType == null || entityId == null) return Mono.empty();

        Function<UUID, Mono<?>> fetcher = fetchers.get(entityType);
        if (fetcher == null) return Mono.empty();

        UUID id;
        try {
            id = UUID.fromString(entityId);
        } catch (IllegalArgumentException e) {
            return Mono.empty();
        }

        return fetcher.apply(id)
            .map(this::toMap)
            .switchIfEmpty(Mono.empty())
            .onErrorResume(e -> Mono.empty());
    }

    public Mono<Integer> fetchVersion(String entityType, String entityId) {
        if (entityType == null || entityId == null) return Mono.empty();

        Function<UUID, Mono<?>> fetcher = fetchers.get(entityType);
        if (fetcher == null) return Mono.empty();

        UUID id;
        try {
            id = UUID.fromString(entityId);
        } catch (IllegalArgumentException e) {
            return Mono.empty();
        }

        return fetcher.apply(id)
            .map(obj -> {
                Map<String, Object> map = toMap(obj);
                Object version = map.get("version");
                if (version instanceof Number n) return n.intValue();
                return null;
            })
            .switchIfEmpty(Mono.empty())
            .onErrorResume(e -> Mono.empty());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toMap(Object obj) {
        return objectMapper.convertValue(obj, Map.class);
    }
}
