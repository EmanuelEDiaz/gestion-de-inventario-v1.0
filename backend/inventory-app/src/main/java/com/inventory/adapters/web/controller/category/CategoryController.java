package com.inventory.adapters.web.controller.category;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.adapters.web.dto.category.*;
import com.inventory.adapters.web.mapper.CatalogWebMapper;
import com.inventory.adapters.web.util.ChecksumUtils;
import com.inventory.domain.ports.in.category.CategoryCommandPort;
import com.inventory.domain.ports.in.category.CategoryQueryPort;
import com.inventory.domain.ports.out.CategoryRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

/**
 * Controller REST para Categorías.
 * Delega lógica de negocio a Use Cases (Ports de entrada).
 */
@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final CategoryQueryPort categoryQuery;
    private final CategoryCommandPort categoryCommand;
    private final CategoryRepository categoryRepository; // Solo para queries adicionales
    private final CatalogWebMapper mapper;
    private final ObjectMapper objectMapper;

    public CategoryController(
            CategoryQueryPort categoryQuery,
            CategoryCommandPort categoryCommand,
            CategoryRepository categoryRepository,
            CatalogWebMapper mapper,
            ObjectMapper objectMapper) {
        this.categoryQuery = categoryQuery;
        this.categoryCommand = categoryCommand;
        this.categoryRepository = categoryRepository;
        this.mapper = mapper;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('categories:read')")
    public Mono<ResponseEntity<Flux<CategoryResponse>>> getAll(@RequestParam(defaultValue = "false") boolean activeOnly) {
        Flux<CategoryResponse> flux = categoryQuery.findAll(activeOnly)
            .map(mapper::toResponse);
        return ChecksumUtils.withChecksum(flux, objectMapper);
    }

    @GetMapping("/roots")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('categories:read')")
    public Flux<CategoryResponse> getRoots() {
        return categoryQuery.findRootCategories()
            .map(mapper::toResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('categories:read')")
    public Mono<ResponseEntity<CategoryResponse>> getById(@PathVariable UUID id) {
        return categoryQuery.findById(id)
            .map(category -> ResponseEntity.ok(mapper.toResponse(category)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/children")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('categories:read')")
    public Flux<CategoryResponse> getChildren(@PathVariable UUID id) {
        return categoryQuery.findByParent(id)
            .map(mapper::toResponse);
    }

    @GetMapping("/{id}/descendants")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('categories:read')")
    public Flux<CategoryResponse> getDescendants(@PathVariable UUID id) {
        return categoryRepository.findDescendants(id)
            .map(mapper::toResponse);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('categories:create')")
    public Mono<ResponseEntity<CategoryResponse>> create(
            @Valid @RequestBody CreateCategoryRequest request,
            @AuthenticationPrincipal UserDetails user) {
        var command = new CategoryCommandPort.CreateCategoryCommand(
            request.name(),
            request.parentId(),
            request.sortOrder() != null ? request.sortOrder() : 0
        );
        return categoryCommand.create(command, extractUserId(user))
            .map(saved -> ResponseEntity.status(HttpStatus.CREATED)
                .body(mapper.toResponse(saved)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('categories:update')")
    public Mono<ResponseEntity<CategoryResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCategoryRequest request,
            @AuthenticationPrincipal UserDetails user) {
        var command = new CategoryCommandPort.UpdateCategoryCommand(
            request.name(),
            request.parentId(),
            request.sortOrder() != null ? request.sortOrder() : 0
        );
        return categoryCommand.update(id, command, extractUserId(user))
            .map(updated -> ResponseEntity.ok(mapper.toResponse(updated)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/batch")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('categories:delete')")
    public Mono<Void> deleteBatch(@RequestBody List<UUID> ids) {
        return categoryCommand.deleteAll(ids);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('categories:delete')")
    public Mono<ResponseEntity<Void>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails user) {
        return categoryCommand.delete(id, extractUserId(user))
            .then(Mono.just(ResponseEntity.noContent().<Void>build()))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('categories:update')")
    public Mono<ResponseEntity<CategoryResponse>> deactivate(@PathVariable UUID id) {
        return categoryQuery.findById(id)
            .flatMap(existing -> {
                var deactivated = existing.deactivate();
                return categoryRepository.save(deactivated)
                    .map(saved -> ResponseEntity.ok(mapper.toResponse(saved)));
            })
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    private UUID extractUserId(UserDetails user) {
        if (user == null) return null;
        try {
            return UUID.fromString(user.getUsername());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('categories:update')")
    public Mono<ResponseEntity<CategoryResponse>> activate(@PathVariable UUID id) {
        return categoryQuery.findById(id)
            .flatMap(existing -> {
                var activated = existing.activate();
                return categoryRepository.save(activated)
                    .map(saved -> ResponseEntity.ok(mapper.toResponse(saved)));
            })
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }
}
