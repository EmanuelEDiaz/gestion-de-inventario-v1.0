package com.inventory.application.usecase.command;

import com.inventory.domain.model.Customer;
import com.inventory.domain.ports.in.CustomerCommandPort;
import com.inventory.domain.ports.out.CustomerRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Implementación de comandos de clientes.
 */
@Service
public class CustomerCommandUseCase implements CustomerCommandPort {
    
    private final CustomerRepository customerRepository;
    
    public CustomerCommandUseCase(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }
    
    @Override
    public Mono<Customer> create(CreateCommand command) {
        Customer customer = Customer.create(
            command.code(),
            command.name(),
            command.contactName(),
            command.phone(),
            command.email()
        );
        
        if (command.address() != null || command.notes() != null) {
            customer = customer.update(
                command.code(),
                command.name(),
                command.contactName(),
                command.phone(),
                command.email(),
                command.address(),
                command.notes()
            );
        }
        
        return customerRepository.save(customer);
    }
    
    @Override
    public Mono<Customer> update(UUID id, UpdateCommand command) {
        return customerRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Customer not found: " + id)))
            .map(existing -> existing.update(
                command.code(),
                command.name(),
                command.contactName(),
                command.phone(),
                command.email(),
                command.address(),
                command.notes()
            ))
            .flatMap(customerRepository::save);
    }
    
    @Override
    public Mono<Void> delete(UUID id) {
        return customerRepository.deleteById(id);
    }
    
    @Override
    public Mono<Customer> activate(UUID id) {
        return customerRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Customer not found: " + id)))
            .map(Customer::activate)
            .flatMap(customerRepository::save);
    }
    
    @Override
    public Mono<Customer> deactivate(UUID id) {
        return customerRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Customer not found: " + id)))
            .map(Customer::deactivate)
            .flatMap(customerRepository::save);
    }
}
