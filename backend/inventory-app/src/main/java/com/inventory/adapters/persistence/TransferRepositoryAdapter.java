package com.inventory.adapters.persistence;

import com.inventory.adapters.persistence.entity.TransferLineEntity;
import com.inventory.adapters.persistence.mapper.TransferEntityMapper;
import com.inventory.adapters.persistence.repository.R2dbcTransferLineRepository;
import com.inventory.adapters.persistence.repository.R2dbcTransferRepository;
import com.inventory.domain.model.transfer.Transfer;
import com.inventory.domain.model.transfer.TransferLine;
import com.inventory.domain.ports.out.TransferRepository;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Adapter: Implementa TransferRepository usando R2DBC.
 * (hexagonal: adapter depende de port, no al revés)
 */
@Component
public class TransferRepositoryAdapter implements TransferRepository {

    private final R2dbcTransferRepository transferRepo;
    private final R2dbcTransferLineRepository lineRepo;
    private final TransferEntityMapper mapper;

    public TransferRepositoryAdapter(
            R2dbcTransferRepository transferRepo,
            R2dbcTransferLineRepository lineRepo,
            TransferEntityMapper mapper) {
        this.transferRepo = transferRepo;
        this.lineRepo = lineRepo;
        this.mapper = mapper;
    }

    @Override
    public Mono<Transfer> save(Transfer transfer) {
        return transferRepo.save(mapper.toEntity(transfer))
                .flatMap(savedEntity -> lineRepo.deleteByTransferId(savedEntity.getId())
                        .thenMany(saveLines(savedEntity.getId(), transfer.getLines()))
                        .collectList()
                        .map(lines -> mapper.toDomainWithLines(savedEntity, lines)));
    }

    @Override
    public Mono<Transfer> findById(UUID id) {
        return transferRepo.findById(id)
                .flatMap(entity -> findLinesByTransferId(id)
                        .collectList()
                        .map(lines -> mapper.toDomainWithLines(entity, lines)));
    }

    @Override
    public Flux<Transfer> findAll() {
        return transferRepo.findAll()
                .flatMap(entity -> findLinesByTransferId(entity.getId())
                        .collectList()
                        .map(lines -> mapper.toDomainWithLines(entity, lines)));
    }

    @Override
    public Flux<Transfer> findByFromWarehouseId(UUID warehouseId) {
        return transferRepo.findByFromWarehouseId(warehouseId)
                .flatMap(entity -> findLinesByTransferId(entity.getId())
                        .collectList()
                        .map(lines -> mapper.toDomainWithLines(entity, lines)));
    }

    @Override
    public Flux<Transfer> findByToWarehouseId(UUID warehouseId) {
        return transferRepo.findByToWarehouseId(warehouseId)
                .flatMap(entity -> findLinesByTransferId(entity.getId())
                        .collectList()
                        .map(lines -> mapper.toDomainWithLines(entity, lines)));
    }

    @Override
    public Flux<Transfer> findByStatus(Transfer.TransferStatus status) {
        return transferRepo.findByStatus(status.name())
                .flatMap(entity -> findLinesByTransferId(entity.getId())
                        .collectList()
                        .map(lines -> mapper.toDomainWithLines(entity, lines)));
    }

    @Override
    public Flux<Transfer> findByTransferDateBetween(LocalDate from, LocalDate to) {
        return transferRepo.findByTransferDateBetween(from, to)
                .flatMap(entity -> findLinesByTransferId(entity.getId())
                        .collectList()
                        .map(lines -> mapper.toDomainWithLines(entity, lines)));
    }

    @Override
    public Mono<Boolean> existsByTransferNumber(String transferNumber) {
        return transferRepo.existsByTransferNumber(transferNumber);
    }

    @Override
    public Mono<Void> deleteById(UUID id) {
        return lineRepo.deleteByTransferId(id)
                .then(transferRepo.deleteById(id));
    }

    @Override
    public Flux<TransferLine> findLinesByTransferId(UUID transferId) {
        return lineRepo.findByTransferIdOrderBySortOrder(transferId)
                .map(mapper::toLineDomain);
    }

    @Override
    public Flux<TransferLine> saveLines(UUID transferId, Iterable<TransferLine> lines) {
        return Flux.fromIterable(lines)
                .map(line -> mapper.toLineEntityWithTransferId(line, transferId))
                .flatMap(lineRepo::save)
                .map(mapper::toLineDomain);
    }

    @Override
    public Mono<Void> deleteLinesByTransferId(UUID transferId) {
        return lineRepo.deleteByTransferId(transferId);
    }

    @Override
    public Mono<String> generateNextTransferNumber() {
        return transferRepo.getNextSequence()
                .map(seq -> String.format("TR-%06d", seq));
    }
}
