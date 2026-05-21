package com.inventory.application.usecase.query.purchase;

import com.inventory.domain.model.purchase.Purchase;
import com.inventory.domain.ports.in.purchase.PurchaseQueryPort;
import com.inventory.domain.ports.out.PurchaseRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
public class PurchaseQueryUseCase implements PurchaseQueryPort {

    private final PurchaseRepository purchaseRepository;

    public PurchaseQueryUseCase(PurchaseRepository purchaseRepository) {
        this.purchaseRepository = purchaseRepository;
    }

    @Override
    public Mono<Purchase> findById(UUID id) {
        return purchaseRepository.findById(id);
    }

    @Override
    public Mono<Purchase> findByNumber(String purchaseNumber) {
        return purchaseRepository.findByPurchaseNumber(purchaseNumber);
    }

    @Override
    public Flux<Purchase> findAll(PurchaseFilter filter) {
        Flux<Purchase> purchases = purchaseRepository.findAllPaginated(filter.page(), filter.size());
        
        if (filter.supplierId() != null) {
            purchases = purchases.filter(p -> p.getSupplierId() != null && 
                    p.getSupplierId().equals(filter.supplierId()));
        }
        if (filter.warehouseId() != null) {
            purchases = purchases.filter(p -> p.getWarehouseId().equals(filter.warehouseId()));
        }
        if (filter.status() != null) {
            purchases = purchases.filter(p -> p.getStatus() == filter.status());
        }
        if (filter.fromDate() != null) {
            purchases = purchases.filter(p -> !p.getPurchaseDate().isBefore(filter.fromDate()));
        }
        if (filter.toDate() != null) {
            purchases = purchases.filter(p -> !p.getPurchaseDate().isAfter(filter.toDate()));
        }
        
        return purchases;
    }

    @Override
    public Flux<Purchase> findBySupplierId(UUID supplierId) {
        return purchaseRepository.findBySupplierId(supplierId);
    }

    @Override
    public Flux<Purchase> findByWarehouseId(UUID warehouseId) {
        return purchaseRepository.findByWarehouseId(warehouseId);
    }

    @Override
    public Flux<Purchase> findByStatus(Purchase.PurchaseStatus status) {
        return purchaseRepository.findByStatus(status);
    }

    @Override
    public Mono<Long> count(PurchaseFilter filter) {
        return purchaseRepository.count();
    }
}
