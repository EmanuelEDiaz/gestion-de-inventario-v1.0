package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.PurchaseEntity;
import com.inventory.adapters.persistence.adapter.entity.PurchaseLineEntity;
import com.inventory.adapters.persistence.adapter.mapper.PurchaseEntityMapper;
import com.inventory.adapters.persistence.adapter.repository.R2dbcPurchaseLineRepository;
import com.inventory.adapters.persistence.adapter.repository.R2dbcPurchaseRepository;
import com.inventory.domain.model.purchase.Purchase;
import com.inventory.domain.model.purchase.PurchaseLine;
import com.inventory.domain.ports.out.PurchaseRepository;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

@Component
public class PurchaseRepositoryAdapter implements PurchaseRepository {

    private final R2dbcPurchaseRepository purchaseRepo;
    private final R2dbcPurchaseLineRepository lineRepo;
    private final PurchaseEntityMapper mapper;

    public PurchaseRepositoryAdapter(
            R2dbcPurchaseRepository purchaseRepo,
            R2dbcPurchaseLineRepository lineRepo,
            PurchaseEntityMapper mapper) {
        this.purchaseRepo = purchaseRepo;
        this.lineRepo = lineRepo;
        this.mapper = mapper;
    }

    @Override
    public Mono<Purchase> findById(UUID id) {
        return purchaseRepo.findById(id)
                .flatMap(this::enrichWithLines);
    }

    @Override
    public Mono<Purchase> findByPurchaseNumber(String purchaseNumber) {
        return purchaseRepo.findByPurchaseNumber(purchaseNumber)
                .flatMap(this::enrichWithLines);
    }

    @Override
    public Flux<Purchase> findBySupplierId(UUID supplierId) {
        return purchaseRepo.findBySupplierId(supplierId)
                .flatMap(this::enrichWithLines);
    }

    @Override
    public Flux<Purchase> findByWarehouseId(UUID warehouseId) {
        return purchaseRepo.findByWarehouseId(warehouseId)
                .flatMap(this::enrichWithLines);
    }

    @Override
    public Flux<Purchase> findByStatus(Purchase.PurchaseStatus status) {
        return purchaseRepo.findByStatus(status.name())
                .flatMap(this::enrichWithLines);
    }

    @Override
    public Flux<Purchase> findByDateRange(LocalDate from, LocalDate to) {
        return purchaseRepo.findByDateRange(from, to)
                .flatMap(this::enrichWithLines);
    }

    @Override
    public Flux<Purchase> findAllPaginated(int page, int size) {
        int offset = page * size;
        return purchaseRepo.findAllPaginated(size, offset)
                .flatMap(this::enrichWithLines);
    }

    @Override
    public Mono<Purchase> save(Purchase purchase) {
        PurchaseEntity entity = mapper.toEntity(purchase);
        
        return purchaseRepo.save(entity)
                .flatMap(savedEntity -> {
                    // Eliminar líneas existentes y guardar las nuevas
                    return lineRepo.deleteByPurchaseId(savedEntity.getId())
                            .thenMany(Flux.fromIterable(purchase.getLines())
                                    .map(line -> mapper.toLineEntity(line, savedEntity.getId()))
                                    .flatMap(lineRepo::save))
                            .collectList()
                            .map(savedLines -> mapper.toDomain(savedEntity, savedLines));
                });
    }

    @Override
    public Mono<Void> delete(UUID id) {
        return lineRepo.deleteByPurchaseId(id)
                .then(purchaseRepo.deleteById(id));
    }

    @Override
    public Mono<Long> count() {
        return purchaseRepo.count();
    }

    @Override
    public Mono<String> generateNextNumber() {
        return purchaseRepo.getNextNumber()
                .map(nextNum -> String.format("PO-%06d", nextNum));
    }

    private Mono<Purchase> enrichWithLines(PurchaseEntity entity) {
        return lineRepo.findByPurchaseIdOrderBySortOrder(entity.getId())
                .collectList()
                .map(lines -> mapper.toDomain(entity, lines));
    }
}
