package com.inventory.application.usecase.query;

import com.inventory.domain.model.supplier.Supplier;
import com.inventory.domain.ports.in.supplier.SupplierQueryPort;
import com.inventory.domain.ports.out.SupplierRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Implementación de consultas de proveedores.
 */
@Service
public class SupplierQueryUseCase implements SupplierQueryPort {
    
    private final SupplierRepository supplierRepository;
    
    public SupplierQueryUseCase(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }
    
    @Override
    public Mono<Supplier> findById(UUID id) {
        return supplierRepository.findById(id);
    }
    
    @Override
    public Flux<Supplier> findAll() {
        return supplierRepository.findAll();
    }
    
    @Override
    public Flux<Supplier> findByActive(boolean active) {
        return supplierRepository.findByActive(active);
    }
    
    @Override
    public Mono<Supplier> findByCode(String code) {
        return supplierRepository.findByCode(code);
    }
    
    @Override
    public Flux<Supplier> search(String query) {
        return supplierRepository.search(query);
    }
}
