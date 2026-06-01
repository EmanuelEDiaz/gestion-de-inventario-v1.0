package com.inventory.adapters.web.controller.audit;

import com.inventory.adapters.web.dto.audit.AuditLogResponse;
import com.inventory.adapters.web.mapper.AuditLogWebMapper;
import com.inventory.application.usecase.query.audit.AuditLogQueryUseCase;
import com.inventory.domain.ports.out.AuditLogSearchCriteria;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit-logs")
@PreAuthorize("hasRole('ADMIN') || hasAuthority('audit:read')")
public class AuditLogController {

    private final AuditLogQueryUseCase queryUseCase;
    private final AuditLogWebMapper mapper;

    public AuditLogController(AuditLogQueryUseCase queryUseCase, AuditLogWebMapper mapper) {
        this.queryUseCase = queryUseCase;
        this.mapper = mapper;
    }

    @GetMapping
    public Mono<ResponseEntity<List<AuditLogResponse>>> getAll(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) UUID actorId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var criteria = new AuditLogSearchCriteria(
            entityType, actorId, action, fromDate, toDate, page, Math.min(size, 100));
        return queryUseCase.search(criteria).map(mapper::toResponse).collectList()
            .zipWith(queryUseCase.countSearch(criteria))
            .map(tuple -> ResponseEntity.ok()
                .header("x-total-count", String.valueOf(tuple.getT2()))
                .body(tuple.getT1()));
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<AuditLogResponse>> getById(@PathVariable UUID id) {
        return queryUseCase.findById(id)
            .map(mapper::toResponse)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    public Flux<AuditLogResponse> getByEntity(
            @PathVariable String entityType,
            @PathVariable UUID entityId) {
        return queryUseCase.findByEntity(entityType, entityId)
            .map(mapper::toResponse);
    }
}
