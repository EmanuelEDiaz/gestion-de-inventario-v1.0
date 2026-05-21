package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.entity.SaleEntity;
import com.inventory.adapters.persistence.entity.SaleLineEntity;
import com.inventory.adapters.persistence.mapper.SaleEntityMapper;
import com.inventory.adapters.persistence.repository.R2dbcSaleLineRepository;
import com.inventory.adapters.persistence.repository.R2dbcSaleRepository;
import com.inventory.domain.model.sale.Sale;
import com.inventory.domain.ports.out.SaleRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public class SaleRepositoryAdapter implements SaleRepository {

    private final R2dbcSaleRepository saleRepository;
    private final R2dbcSaleLineRepository lineRepository;
    private final SaleEntityMapper mapper;

    public SaleRepositoryAdapter(
        R2dbcSaleRepository saleRepository,
        R2dbcSaleLineRepository lineRepository,
        SaleEntityMapper mapper
    ) {
        this.saleRepository = saleRepository;
        this.lineRepository = lineRepository;
        this.mapper = mapper;
    }

    @Override
    public Mono<Sale> findById(UUID id) {
        return saleRepository.findById(id)
            .flatMap(this::enrichWithLines);
    }

    @Override
    public Mono<Sale> findByNumber(String saleNumber) {
        return saleRepository.findBySaleNumber(saleNumber)
            .flatMap(this::enrichWithLines);
    }

    @Override
    public Flux<Sale> findAll() {
        return saleRepository.findAllByOrderBySaleDateDesc()
            .flatMap(this::enrichWithLines);
    }

    @Override
    public Flux<Sale> findByWarehouseId(UUID warehouseId) {
        return saleRepository.findByWarehouseId(warehouseId)
            .flatMap(this::enrichWithLines);
    }

    @Override
    public Flux<Sale> findByCustomerId(UUID customerId) {
        return saleRepository.findByCustomerId(customerId)
            .flatMap(this::enrichWithLines);
    }

    @Override
    public Flux<Sale> findByStatus(Sale.SaleStatus status) {
        return saleRepository.findByStatus(status.name())
            .flatMap(this::enrichWithLines);
    }

    @Override
    public Flux<Sale> findByDateRange(LocalDate from, LocalDate to) {
        return saleRepository.findByDateRange(from, to)
            .flatMap(this::enrichWithLines);
    }

    @Override
    public Mono<Sale> save(Sale sale) {
        SaleEntity entity = mapper.toEntity(sale);
        
        return saleRepository.save(entity)
            .flatMap(saved -> {
                // Delete existing lines and save new ones
                List<SaleLineEntity> lineEntities = sale.lines().stream()
                    .map(line -> mapper.lineToEntity(line, saved.getId()))
                    .toList();

                return lineRepository.deleteBySaleId(saved.getId())
                    .thenMany(Flux.fromIterable(lineEntities))
                    .flatMap(lineRepository::save)
                    .collectList()
                    .map(savedLines -> mapper.toDomainWithLines(saved, savedLines));
            });
    }

    @Override
    public Mono<Void> deleteById(UUID id) {
        return lineRepository.deleteBySaleId(id)
            .then(saleRepository.deleteById(id));
    }

    @Override
    public Mono<String> generateSaleNumber() {
        return saleRepository.getNextSaleNumber()
            .map(num -> String.format("VTA-%06d", num));
    }

    private Mono<Sale> enrichWithLines(SaleEntity entity) {
        return lineRepository.findBySaleIdOrderBySortOrder(entity.getId())
            .collectList()
            .map(lines -> mapper.toDomainWithLines(entity, lines));
    }
}
