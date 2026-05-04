package com.inventory.adapters.web.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/settings")
public class SettingsController {

    private final Map<String, Object> settings = new ConcurrentHashMap<>(Map.of(
        "defaultCostMethod", "STANDARD",
        "defaultCurrencyCode", "CUP",
        "companyName", "",
        "lowStockThresholdDefault", BigDecimal.ZERO,
        "maxProductPages", 20,
        "searchDebounceMs", 300,
        "version", 0
    ));

    @GetMapping
    public Mono<ResponseEntity<Map<String, Object>>> getSettings() {
        return Mono.just(ResponseEntity.ok(settings));
    }

    @PatchMapping
    public Mono<ResponseEntity<Map<String, Object>>> updateSettings(
            @RequestBody Map<String, Object> updates,
            @RequestHeader(value = "If-Match", required = false) String ifMatch) {
        
        settings.putAll(updates);
        settings.put("version", ((Integer)settings.get("version")) + 1);
        
        return Mono.just(ResponseEntity.ok(settings));
    }
}