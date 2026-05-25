package com.inventory.domain.ports.out;

import com.inventory.domain.model.returns.Return;
import com.inventory.domain.model.returns.ReturnLine;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Puerto de salida para persistencia de devoluciones.
 */
public interface ReturnRepository {
    
    Mono<Return> save(Return returnEntity);
    Mono<Return> findById(UUID id);
    Flux<Return> findAll();
    Flux<Return> findByWarehouseId(UUID warehouseId);
    Flux<Return> findByType(Return.ReturnType type);
    Flux<Return> findByStatus(Return.ReturnStatus status);
    Flux<Return> findByReturnDateBetween(LocalDate from, LocalDate to);
    Mono<Void> deleteById(UUID id);
    Mono<Void> deleteAllById(List<UUID> ids);
    Mono<String> generateReturnNumber(Return.ReturnType type);

    // Líneas
    Flux<ReturnLine> findLinesByReturnId(UUID returnId);
    Mono<Void> deleteLinesByReturnId(UUID returnId);
}
