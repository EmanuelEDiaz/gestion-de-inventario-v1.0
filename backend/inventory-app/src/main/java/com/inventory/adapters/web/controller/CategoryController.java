package com.inventory.adapters.web.controller;

import com.inventory.adapters.web.dto.*;
import com.inventory.adapters.web.mapper.CatalogWebMapper;
import com.inventory.domain.model.Category;
import com.inventory.domain.ports.out.CategoryRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final CatalogWebMapper mapper;

    public CategoryController(CategoryRepository categoryRepository, CatalogWebMapper mapper) {
        this.categoryRepository = categoryRepository;
        this.mapper = mapper;
    }

    @GetMapping
    public Flux<CategoryResponse> getAll(@RequestParam(defaultValue = "false") boolean activeOnly) {
        Flux<Category> categories = activeOnly 
            ? categoryRepository.findAllActive() 
            : categoryRepository.findAll();
        return categories.map(mapper::toResponse);
    }

    @GetMapping("/roots")
    public Flux<CategoryResponse> getRoots() {
        return categoryRepository.findRoots()
            .map(mapper::toResponse);
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<CategoryResponse>> getById(@PathVariable UUID id) {
        return categoryRepository.findById(id)
            .map(category -> ResponseEntity.ok(mapper.toResponse(category)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/children")
    public Flux<CategoryResponse> getChildren(@PathVariable UUID id) {
        return categoryRepository.findByParentId(id)
            .map(mapper::toResponse);
    }

    @GetMapping("/{id}/descendants")
    public Flux<CategoryResponse> getDescendants(@PathVariable UUID id) {
        return categoryRepository.findDescendants(id)
            .map(mapper::toResponse);
    }

    @PostMapping
    public Mono<ResponseEntity<CategoryResponse>> create(@Valid @RequestBody CreateCategoryRequest request) {
        Mono<Category> categoryMono;
        
        if (request.parentId() == null) {
            // Categoría raíz
            categoryMono = Mono.just(Category.createRoot(
                request.name(),
                request.sortOrder() != null ? request.sortOrder() : 0
            ));
        } else {
            // Categoría hija
            categoryMono = categoryRepository.findById(request.parentId())
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Categoría padre no encontrada")))
                .map(parent -> Category.createChild(
                    parent,
                    request.name(),
                    request.sortOrder() != null ? request.sortOrder() : 0
                ));
        }

        return categoryMono
            .flatMap(categoryRepository::save)
            .map(saved -> ResponseEntity.status(HttpStatus.CREATED)
                .body(mapper.toResponse(saved)))
            .onErrorResume(IllegalArgumentException.class, e -> 
                Mono.just(ResponseEntity.badRequest().build()));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<CategoryResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCategoryRequest request) {
        return categoryRepository.findById(id)
            .flatMap(existing -> {
                Category updated = existing.rename(request.name());
                if (request.sortOrder() != null) {
                    updated = updated.reorder(request.sortOrder());
                }
                return categoryRepository.save(updated)
                    .map(saved -> ResponseEntity.ok(mapper.toResponse(saved)));
            })
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(@PathVariable UUID id) {
        return categoryRepository.countProducts(id)
            .flatMap(count -> {
                if (count > 0) {
                    return Mono.just(ResponseEntity.status(HttpStatus.CONFLICT).<Void>build());
                }
                return categoryRepository.findById(id)
                    .flatMap(existing -> categoryRepository.deleteById(id)
                        .then(Mono.just(ResponseEntity.noContent().<Void>build())))
                    .defaultIfEmpty(ResponseEntity.notFound().build());
            });
    }

    @PostMapping("/{id}/deactivate")
    public Mono<ResponseEntity<CategoryResponse>> deactivate(@PathVariable UUID id) {
        return categoryRepository.findById(id)
            .flatMap(existing -> {
                Category deactivated = existing.deactivate();
                return categoryRepository.save(deactivated)
                    .map(saved -> ResponseEntity.ok(mapper.toResponse(saved)));
            })
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/activate")
    public Mono<ResponseEntity<CategoryResponse>> activate(@PathVariable UUID id) {
        return categoryRepository.findById(id)
            .flatMap(existing -> {
                Category activated = existing.activate();
                return categoryRepository.save(activated)
                    .map(saved -> ResponseEntity.ok(mapper.toResponse(saved)));
            })
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }
}
