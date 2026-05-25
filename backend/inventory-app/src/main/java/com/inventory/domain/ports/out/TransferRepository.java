package com.inventory.domain.ports.out;

import com.inventory.domain.model.transfer.Transfer;
import com.inventory.domain.model.transfer.TransferLine;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Puerto de salida: Repositorio de Transferencias.
 * Contrato para persistencia (hexagonal: adapter implementará esto).
 */
public interface TransferRepository {

    Mono<Transfer> save(Transfer transfer);
    Mono<Transfer> findById(UUID id);
    Flux<Transfer> findAll();
    Flux<Transfer> findByFromWarehouseId(UUID warehouseId);
    Flux<Transfer> findByToWarehouseId(UUID warehouseId);
    Flux<Transfer> findByStatus(Transfer.TransferStatus status);
    Flux<Transfer> findByTransferDateBetween(LocalDate from, LocalDate to);
    Mono<Boolean> existsByTransferNumber(String transferNumber);
    Mono<Void> deleteById(UUID id);
    Mono<Void> deleteAllById(List<UUID> ids);
    Flux<TransferLine> findLinesByTransferId(UUID transferId);
    Flux<TransferLine> saveLines(UUID transferId, Iterable<TransferLine> lines);
    Mono<Void> deleteLinesByTransferId(UUID transferId);
    Mono<String> generateNextTransferNumber();
}
