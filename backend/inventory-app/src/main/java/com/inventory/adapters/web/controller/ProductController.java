package com.inventory.adapters.web.controller;

import com.inventory.adapters.web.dto.*;
import com.inventory.adapters.web.mapper.CatalogWebMapper;
import com.inventory.domain.model.Category;
import com.inventory.domain.model.Product;
import com.inventory.domain.ports.in.ProductCommandPort;
import com.inventory.domain.ports.in.ProductQueryPort;
import com.inventory.domain.ports.out.CategoryRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Controller REST para Productos.
 * Delega lógica de negocio a Use Cases (Ports de entrada).
 */
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductQueryPort productQuery;
    private final ProductCommandPort productCommand;
    private final CategoryRepository categoryRepository; // Solo para enriquecer respuestas
    private final CatalogWebMapper mapper;

    public ProductController(
            ProductQueryPort productQuery,
            ProductCommandPort productCommand,
            CategoryRepository categoryRepository,
            CatalogWebMapper mapper) {
        this.productQuery = productQuery;
        this.productCommand = productCommand;
        this.categoryRepository = categoryRepository;
        this.mapper = mapper;
    }

    @GetMapping
    public Flux<ProductResponse> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        return productQuery.findAll(page, Math.min(size, 100), activeOnly)
            .flatMap(this::enrichWithCategory);
    }

    @GetMapping("/search")
    public Flux<ProductResponse> search(@RequestParam String q) {
        return productQuery.search(q)
            .flatMap(this::enrichWithCategory);
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<ProductResponse>> getById(@PathVariable UUID id) {
        return productQuery.findById(id)
            .flatMap(this::enrichWithCategory)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/sku/{sku}")
    public Mono<ResponseEntity<ProductResponse>> getBySku(@PathVariable String sku) {
        return productQuery.findBySku(sku)
            .flatMap(this::enrichWithCategory)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/barcode/{barcode}")
    public Mono<ResponseEntity<ProductResponse>> getByBarcode(@PathVariable String barcode) {
        return productQuery.findByBarcode(barcode)
            .flatMap(this::enrichWithCategory)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{categoryId}")
    public Flux<ProductResponse> getByCategory(@PathVariable UUID categoryId) {
        return productQuery.findByCategory(categoryId)
            .flatMap(this::enrichWithCategory);
    }

    @GetMapping("/count")
    public Mono<Long> count(@RequestParam(required = false) String status) {
        if (status != null) {
            return productQuery.countByStatus(Product.ProductStatus.valueOf(status.toUpperCase()));
        }
        return productQuery.count();
    }

    @PostMapping
    public Mono<ResponseEntity<ProductResponse>> create(@Valid @RequestBody CreateProductRequest request) {
        var command = new ProductCommandPort.CreateProductCommand(
            request.name(),
            request.sku(),
            request.barcode(),
            request.description(),
            request.categoryId(),
            request.standardCost(),
            request.salePrice(),
            request.reorderPoint(),
            request.taxRate(),
            request.unitOfMeasure()
        );
        return productCommand.create(command)
            .flatMap(this::enrichWithCategory)
            .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<ProductResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest request) {
        var command = new ProductCommandPort.UpdateProductCommand(
            request.name(),
            request.sku(),
            request.barcode(),
            request.description(),
            request.categoryId(),
            request.costMethod() != null ? Product.CostMethod.valueOf(request.costMethod()) : null,
            request.standardCost(),
            request.salePrice(),
            request.reorderPoint(),
            request.taxRate(),
            request.unitOfMeasure()
        );
        return productCommand.update(id, command)
            .flatMap(this::enrichWithCategory)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(@PathVariable UUID id) {
        return productCommand.delete(id)
            .then(Mono.just(ResponseEntity.noContent().<Void>build()))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/archive")
    public Mono<ResponseEntity<ProductResponse>> archive(@PathVariable UUID id) {
        return productCommand.archive(id)
            .flatMap(this::enrichWithCategory)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/activate")
    public Mono<ResponseEntity<ProductResponse>> activate(@PathVariable UUID id) {
        return productCommand.activate(id)
            .flatMap(this::enrichWithCategory)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    // Helper para enriquecer respuestas con nombre de categoría

    private Mono<ProductResponse> enrichWithCategory(Product product) {
        if (product.getCategoryId() == null) {
            return Mono.just(mapper.toResponse(product, null));
        }
        return categoryRepository.findById(product.getCategoryId())
            .map(Category::getName)
            .defaultIfEmpty("")
            .map(categoryName -> mapper.toResponse(product, categoryName));
    }
}
