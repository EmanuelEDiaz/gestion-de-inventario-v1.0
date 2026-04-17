package com.inventory.application.usecase.command;

import com.inventory.domain.errors.ConflictException;
import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.Warehouse;
import com.inventory.domain.ports.in.WarehouseCommandPort;
import com.inventory.domain.ports.out.WarehouseRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: Comandos de Almacenes.
 */
@Service
public class WarehouseCommandUseCase implements WarehouseCommandPort {

    private final WarehouseRepository warehouseRepository;

    public WarehouseCommandUseCase(WarehouseRepository warehouseRepository) {
        this.warehouseRepository = warehouseRepository;
    }

    @Override
    public Mono<Warehouse> create(CreateWarehouseCommand command) {
        return validateUniqueCode(command.code())
            .then(Mono.defer(() -> {
                Warehouse warehouse = Warehouse.create(
                    command.code(),
                    command.name(),
                    command.address()
                );
                return warehouseRepository.save(warehouse);
            }));
    }

    @Override
    public Mono<Warehouse> update(UUID id, UpdateWarehouseCommand command) {
        return warehouseRepository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Almacén", id.toString())))
            .map(existing -> existing.update(command.name(), command.address()))
            .flatMap(warehouseRepository::save);
    }

    @Override
    public Mono<Warehouse> activate(UUID id) {
        return warehouseRepository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Almacén", id.toString())))
            .map(Warehouse::activate)
            .flatMap(warehouseRepository::save);
    }

    @Override
    public Mono<Warehouse> deactivate(UUID id) {
        return warehouseRepository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Almacén", id.toString())))
            .map(Warehouse::deactivate)
            .flatMap(warehouseRepository::save);
    }

    private Mono<Void> validateUniqueCode(String code) {
        return warehouseRepository.existsByCode(code)
            .flatMap(exists -> exists
                ? Mono.error(new ConflictException("Código de almacén", code))
                : Mono.empty());
    }
}
