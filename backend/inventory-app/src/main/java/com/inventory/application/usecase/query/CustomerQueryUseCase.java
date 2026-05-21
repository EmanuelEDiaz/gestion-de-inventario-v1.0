package com.inventory.application.usecase.query;

import com.inventory.domain.model.customer.Customer;
import com.inventory.domain.ports.in.customer.CustomerQueryPort;
import com.inventory.domain.ports.out.CustomerRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Implementación de consultas de clientes.
 */
@Service
public class CustomerQueryUseCase implements CustomerQueryPort {
    
    private final CustomerRepository customerRepository;
    
    public CustomerQueryUseCase(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }
    
    @Override
    public Mono<Customer> findById(UUID id) {
        return customerRepository.findById(id);
    }
    
    @Override
    public Flux<Customer> findAll() {
        return customerRepository.findAll();
    }
    
    @Override
    public Flux<Customer> findByActive(boolean active) {
        return customerRepository.findByActive(active);
    }
    
    @Override
    public Mono<Customer> findByCode(String code) {
        return customerRepository.findByCode(code);
    }
    
    @Override
    public Flux<Customer> search(String query) {
        return customerRepository.search(query);
    }
}
