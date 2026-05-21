package com.inventory.application.usecase.query;

import com.inventory.domain.model.returns.Return;
import com.inventory.domain.ports.in.returns.ReturnQueryPort;
import com.inventory.domain.ports.out.ReturnRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Caso de uso: Consultas de devoluciones.
 */
@Service
public class ReturnQueryUseCase implements ReturnQueryPort {

    private final ReturnRepository returnRepository;

    public ReturnQueryUseCase(ReturnRepository returnRepository) {
        this.returnRepository = returnRepository;
    }

    @Override
    public Mono<Return> findById(UUID id) {
        return returnRepository.findById(id);
    }

    @Override
    public Flux<Return> findAll() {
        return returnRepository.findAll();
    }

    @Override
    public Flux<Return> findByWarehouse(UUID warehouseId) {
        return returnRepository.findByWarehouseId(warehouseId);
    }

    @Override
    public Flux<Return> findByType(Return.ReturnType type) {
        return returnRepository.findByType(type);
    }

    @Override
    public Flux<Return> findByStatus(Return.ReturnStatus status) {
        return returnRepository.findByStatus(status);
    }

    @Override
    public Flux<Return> findByDateRange(LocalDate from, LocalDate to) {
        return returnRepository.findByReturnDateBetween(from, to);
    }
}
