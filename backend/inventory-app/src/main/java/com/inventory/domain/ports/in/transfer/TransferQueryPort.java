package com.inventory.domain.ports.in.transfer;

import com.inventory.domain.model.transfer.Transfer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Puerto de entrada: Consultas de Transferencias.
 * Define las operaciones de lectura (clean-code: SRP - solo queries).
 */
public interface TransferQueryPort {

    Mono<Transfer> findById(UUID id);
    Flux<Transfer> findAll();
    Flux<Transfer> findByFromWarehouse(UUID warehouseId);
    Flux<Transfer> findByToWarehouse(UUID warehouseId);
    Flux<Transfer> findByWarehouse(UUID warehouseId);
    Flux<Transfer> findByStatus(Transfer.TransferStatus status);
    Flux<Transfer> findByDateRange(LocalDate from, LocalDate to);
    Mono<Boolean> existsByNumber(String transferNumber);
}
