package com.inventory.application.usecase.command;

import com.inventory.domain.model.Supplier;
import com.inventory.domain.ports.in.SupplierCommandPort;
import com.inventory.domain.ports.out.SupplierRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Implementación de comandos de proveedores.
 */
@Service
public class SupplierCommandUseCase implements SupplierCommandPort {
    
    private final SupplierRepository supplierRepository;
    
    public SupplierCommandUseCase(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }
    
    @Override
    public Mono<Supplier> create(CreateCommand command) {
        Supplier supplier = Supplier.create(
            command.code(),
            command.name(),
            command.contactName(),
            command.phone(),
            command.email()
        );
        
        if (command.address() != null || command.notes() != null) {
            supplier = supplier.update(
                command.code(),
                command.name(),
                command.contactName(),
                command.phone(),
                command.email(),
                command.address(),
                command.notes()
            );
        }
        
        return supplierRepository.save(supplier);
    }
    
    @Override
    public Mono<Supplier> update(UUID id, UpdateCommand command) {
        return supplierRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Supplier not found: " + id)))
            .map(existing -> existing.update(
                command.code(),
                command.name(),
                command.contactName(),
                command.phone(),
                command.email(),
                command.address(),
                command.notes()
            ))
            .flatMap(supplierRepository::save);
    }
    
    @Override
    public Mono<Void> delete(UUID id) {
        return supplierRepository.deleteById(id);
    }
    
    @Override
    public Mono<Supplier> activate(UUID id) {
        return supplierRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Supplier not found: " + id)))
            .map(Supplier::activate)
            .flatMap(supplierRepository::save);
    }
    
    @Override
    public Mono<Supplier> deactivate(UUID id) {
        return supplierRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Supplier not found: " + id)))
            .map(Supplier::deactivate)
            .flatMap(supplierRepository::save);
    }
}
