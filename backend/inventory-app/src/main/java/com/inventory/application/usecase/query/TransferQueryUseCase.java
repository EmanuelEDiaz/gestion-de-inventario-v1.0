package com.inventory.application.usecase.query;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.Transfer;
import com.inventory.domain.ports.in.TransferQueryPort;
import com.inventory.domain.ports.out.TransferRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Use Case: Consultas de Transferencias.
 * Implementa TransferQueryPort (clean-code: SRP - solo lectura).
 */
@Service
public class TransferQueryUseCase implements TransferQueryPort {

    private final TransferRepository transferRepository;

    public TransferQueryUseCase(TransferRepository transferRepository) {
        this.transferRepository = transferRepository;
    }

    @Override
    public Mono<Transfer> findById(UUID id) {
        return transferRepository.findById(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Transfer not found: " + id)));
    }

    @Override
    public Flux<Transfer> findAll() {
        return transferRepository.findAll();
    }

    @Override
    public Flux<Transfer> findByFromWarehouse(UUID warehouseId) {
        return transferRepository.findByFromWarehouseId(warehouseId);
    }

    @Override
    public Flux<Transfer> findByToWarehouse(UUID warehouseId) {
        return transferRepository.findByToWarehouseId(warehouseId);
    }

    @Override
    public Flux<Transfer> findByWarehouse(UUID warehouseId) {
        // Combina transferencias desde y hacia el almacén
        return Flux.merge(
                transferRepository.findByFromWarehouseId(warehouseId),
                transferRepository.findByToWarehouseId(warehouseId))
                .distinct(Transfer::getId);
    }

    @Override
    public Flux<Transfer> findByStatus(Transfer.TransferStatus status) {
        return transferRepository.findByStatus(status);
    }

    @Override
    public Flux<Transfer> findByDateRange(LocalDate from, LocalDate to) {
        return transferRepository.findByTransferDateBetween(from, to);
    }

    @Override
    public Mono<Boolean> existsByNumber(String transferNumber) {
        return transferRepository.existsByTransferNumber(transferNumber);
    }
}
