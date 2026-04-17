package com.inventory.adapters.web.controller;

import com.inventory.adapters.web.dto.*;
import com.inventory.adapters.web.mapper.CatalogWebMapper;
import com.inventory.domain.model.Category;
import com.inventory.domain.model.Product;
import com.inventory.domain.ports.out.CategoryRepository;
import com.inventory.domain.ports.out.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CatalogWebMapper mapper;

    public ProductController(ProductRepository productRepository,
                              CategoryRepository categoryRepository,
                              CatalogWebMapper mapper) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.mapper = mapper;
    }

    @GetMapping
    public Flux<ProductResponse> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        
        Flux<Product> products = activeOnly 
            ? productRepository.findAllActive()
            : productRepository.findAllPaginated(page, Math.min(size, 100));
        
        return products.flatMap(this::enrichWithCategory);
    }

    @GetMapping("/search")
    public Flux<ProductResponse> search(@RequestParam String q) {
        return productRepository.search(q)
            .flatMap(this::enrichWithCategory);
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<ProductResponse>> getById(@PathVariable UUID id) {
        return productRepository.findById(id)
            .flatMap(this::enrichWithCategory)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/sku/{sku}")
    public Mono<ResponseEntity<ProductResponse>> getBySku(@PathVariable String sku) {
        return productRepository.findBySku(sku)
            .flatMap(this::enrichWithCategory)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/barcode/{barcode}")
    public Mono<ResponseEntity<ProductResponse>> getByBarcode(@PathVariable String barcode) {
        return productRepository.findByBarcode(barcode)
            .flatMap(this::enrichWithCategory)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{categoryId}")
    public Flux<ProductResponse> getByCategory(@PathVariable UUID categoryId) {
        return productRepository.findByCategory(categoryId)
            .flatMap(this::enrichWithCategory);
    }

    @GetMapping("/count")
    public Mono<Long> count(@RequestParam(required = false) String status) {
        if (status != null) {
            return productRepository.countByStatus(Product.ProductStatus.valueOf(status.toUpperCase()));
        }
        return productRepository.count();
    }

    @PostMapping
    public Mono<ResponseEntity<ProductResponse>> create(@Valid @RequestBody CreateProductRequest request) {
        return validateUniqueConstraints(request.sku(), request.barcode(), null)
            .flatMap(valid -> {
                if (!valid) {
                    return Mono.just(ResponseEntity.status(HttpStatus.CONFLICT)
                        .<ProductResponse>build());
                }
                Product product = mapper.toDomain(request);
                return productRepository.save(product)
                    .flatMap(this::enrichWithCategory)
                    .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
            });
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<ProductResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest request) {
        return productRepository.findById(id)
            .flatMap(existing -> validateUniqueConstraints(request.sku(), request.barcode(), id)
                .flatMap(valid -> {
                    if (!valid) {
                        return Mono.just(ResponseEntity.status(HttpStatus.CONFLICT)
                            .<ProductResponse>build());
                    }
                    Product updated = mapper.applyUpdate(existing, request);
                    return productRepository.save(updated)
                        .flatMap(this::enrichWithCategory)
                        .map(ResponseEntity::ok);
                }))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(@PathVariable UUID id) {
        return productRepository.findById(id)
            .flatMap(existing -> productRepository.deleteById(id)
                .then(Mono.just(ResponseEntity.noContent().<Void>build())))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/archive")
    public Mono<ResponseEntity<ProductResponse>> archive(@PathVariable UUID id) {
        return productRepository.findById(id)
            .flatMap(existing -> {
                Product archived = existing.archive();
                return productRepository.save(archived)
                    .flatMap(this::enrichWithCategory)
                    .map(ResponseEntity::ok);
            })
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/activate")
    public Mono<ResponseEntity<ProductResponse>> activate(@PathVariable UUID id) {
        return productRepository.findById(id)
            .flatMap(existing -> {
                Product activated = existing.activate();
                return productRepository.save(activated)
                    .flatMap(this::enrichWithCategory)
                    .map(ResponseEntity::ok);
            })
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    // Helpers

    private Mono<ProductResponse> enrichWithCategory(Product product) {
        if (product.getCategoryId() == null) {
            return Mono.just(mapper.toResponse(product, null));
        }
        return categoryRepository.findById(product.getCategoryId())
            .map(Category::getName)
            .defaultIfEmpty("")
            .map(categoryName -> mapper.toResponse(product, categoryName));
    }

    private Mono<Boolean> validateUniqueConstraints(String sku, String barcode, UUID excludeId) {
        Mono<Boolean> skuCheck = sku == null || sku.isBlank() 
            ? Mono.just(true)
            : productRepository.findBySku(sku)
                .map(existing -> excludeId != null && existing.getId().equals(excludeId))
                .defaultIfEmpty(true);

        Mono<Boolean> barcodeCheck = barcode == null || barcode.isBlank()
            ? Mono.just(true)
            : productRepository.findByBarcode(barcode)
                .map(existing -> excludeId != null && existing.getId().equals(excludeId))
                .defaultIfEmpty(true);

        return Mono.zip(skuCheck, barcodeCheck)
            .map(tuple -> tuple.getT1() && tuple.getT2());
    }
}
