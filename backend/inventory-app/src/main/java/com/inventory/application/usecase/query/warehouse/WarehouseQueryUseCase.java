package com.inventory.application.usecase.query.warehouse;

import com.inventory.domain.model.warehouse.Warehouse;
import com.inventory.domain.ports.in.warehouse.WarehouseQueryPort;
import com.inventory.domain.ports.out.WarehouseRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: Consultas de Almacenes.
 */
@Service
public class WarehouseQueryUseCase implements WarehouseQueryPort {

    private final WarehouseRepository warehouseRepository;

    public WarehouseQueryUseCase(WarehouseRepository warehouseRepository) {
        this.warehouseRepository = warehouseRepository;
    }

    @Override
    public Mono<Warehouse> findById(UUID id) {
        return warehouseRepository.findById(id);
    }

    @Override
    public Mono<Warehouse> findByCode(String code) {
        return warehouseRepository.findByCode(code);
    }

    @Override
    public Flux<Warehouse> findAll(boolean activeOnly) {
        return activeOnly 
            ? warehouseRepository.findAllActive() 
            : warehouseRepository.findAll();
    }
}
