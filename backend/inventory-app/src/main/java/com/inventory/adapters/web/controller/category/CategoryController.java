package com.inventory.adapters.web.controller.category;

import com.inventory.adapters.web.dto.*;
import com.inventory.adapters.web.mapper.CatalogWebMapper;
import com.inventory.domain.ports.in.category.CategoryCommandPort;
import com.inventory.domain.ports.in.category.CategoryQueryPort;
import com.inventory.domain.ports.out.CategoryRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

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

    public CategoryController(
            CategoryQueryPort categoryQuery,
            CategoryCommandPort categoryCommand,
            CategoryRepository categoryRepository,
            CatalogWebMapper mapper) {
        this.categoryQuery = categoryQuery;
        this.categoryCommand = categoryCommand;
        this.categoryRepository = categoryRepository;
        this.mapper = mapper;
    }

    @GetMapping
    public Flux<CategoryResponse> getAll(@RequestParam(defaultValue = "false") boolean activeOnly) {
        return categoryQuery.findAll(activeOnly)
            .map(mapper::toResponse);
    }

    @GetMapping("/roots")
    public Flux<CategoryResponse> getRoots() {
        return categoryQuery.findRootCategories()
            .map(mapper::toResponse);
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<CategoryResponse>> getById(@PathVariable UUID id) {
        return categoryQuery.findById(id)
            .map(category -> ResponseEntity.ok(mapper.toResponse(category)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/children")
    public Flux<CategoryResponse> getChildren(@PathVariable UUID id) {
        return categoryQuery.findByParent(id)
            .map(mapper::toResponse);
    }

    @GetMapping("/{id}/descendants")
    public Flux<CategoryResponse> getDescendants(@PathVariable UUID id) {
        return categoryRepository.findDescendants(id)
            .map(mapper::toResponse);
    }

    @PostMapping
    public Mono<ResponseEntity<CategoryResponse>> create(@Valid @RequestBody CreateCategoryRequest request) {
        var command = new CategoryCommandPort.CreateCategoryCommand(
            request.name(),
            request.parentId(),
            request.sortOrder() != null ? request.sortOrder() : 0
        );
        return categoryCommand.create(command)
            .map(saved -> ResponseEntity.status(HttpStatus.CREATED)
                .body(mapper.toResponse(saved)));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<CategoryResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCategoryRequest request) {
        var command = new CategoryCommandPort.UpdateCategoryCommand(
            request.name(),
            request.parentId(),
            request.sortOrder() != null ? request.sortOrder() : 0
        );
        return categoryCommand.update(id, command)
            .map(updated -> ResponseEntity.ok(mapper.toResponse(updated)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(@PathVariable UUID id) {
        return categoryCommand.delete(id)
            .then(Mono.just(ResponseEntity.noContent().<Void>build()))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/deactivate")
    public Mono<ResponseEntity<CategoryResponse>> deactivate(@PathVariable UUID id) {
        return categoryQuery.findById(id)
            .flatMap(existing -> {
                var deactivated = existing.deactivate();
                return categoryRepository.save(deactivated)
                    .map(saved -> ResponseEntity.ok(mapper.toResponse(saved)));
            })
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/activate")
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
