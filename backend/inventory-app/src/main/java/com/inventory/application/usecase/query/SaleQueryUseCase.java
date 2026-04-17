package com.inventory.application.usecase.query;

import com.inventory.domain.model.Sale;
import com.inventory.domain.ports.in.SaleQueryPort;
import com.inventory.domain.ports.out.SaleRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class SaleQueryUseCase implements SaleQueryPort {

    private final SaleRepository saleRepository;

    public SaleQueryUseCase(SaleRepository saleRepository) {
        this.saleRepository = saleRepository;
    }

    @Override
    public Mono<Sale> findById(UUID id) {
        return saleRepository.findById(id);
    }

    @Override
    public Mono<Sale> findByNumber(String saleNumber) {
        return saleRepository.findByNumber(saleNumber);
    }

    @Override
    public Flux<Sale> findAll() {
        return saleRepository.findAll();
    }

    @Override
    public Flux<Sale> findByWarehouse(UUID warehouseId) {
        return saleRepository.findByWarehouseId(warehouseId);
    }

    @Override
    public Flux<Sale> findByCustomer(UUID customerId) {
        return saleRepository.findByCustomerId(customerId);
    }

    @Override
    public Flux<Sale> findByStatus(Sale.SaleStatus status) {
        return saleRepository.findByStatus(status);
    }

    @Override
    public Flux<Sale> findByDateRange(LocalDate from, LocalDate to) {
        return saleRepository.findByDateRange(from, to);
    }
}
