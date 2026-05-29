package com.inventory.application.usecase.command.customer;

import com.inventory.application.shared.AuditSerializer;
import com.inventory.domain.model.audit.AuditLog;
import com.inventory.domain.model.customer.Customer;
import com.inventory.domain.ports.in.customer.CustomerCommandPort;
import com.inventory.domain.ports.out.AuditLogRepository;
import com.inventory.domain.ports.out.CustomerRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

/**
 * Implementación de comandos de clientes.
 */
@Service
public class CustomerCommandUseCase implements CustomerCommandPort {
    
    private final CustomerRepository customerRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditSerializer auditSerializer;
    
    public CustomerCommandUseCase(CustomerRepository customerRepository,
                                  AuditLogRepository auditLogRepository,
                                  AuditSerializer auditSerializer) {
        this.customerRepository = customerRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditSerializer = auditSerializer;
    }
    
    @Override
    public Mono<Customer> create(CreateCommand command, UUID userId) {
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
        return customerRepository.save(customer)
            .flatMap(c -> {
                AuditLog log = AuditLog.create(
                    userId, "CUSTOMER", c.getId(), "CREATE",
                    null, auditSerializer.toJson(c), null
                );
                return auditLogRepository.save(log).thenReturn(c);
            });
    }
    
    @Override
    public Mono<Customer> update(UUID id, UpdateCommand command, UUID userId) {
        return customerRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Customer not found: " + id)))
            .flatMap(existing -> {
                String beforeJson = auditSerializer.toJson(existing);
                Customer updated = existing.update(
                    command.code(),
                    command.name(),
                    command.contactName(),
                    command.phone(),
                    command.email(),
                    command.address(),
                    command.notes()
                );
                return customerRepository.save(updated)
                    .flatMap(c -> {
                        AuditLog log = AuditLog.create(
                            userId, "CUSTOMER", c.getId(), "UPDATE",
                            beforeJson, auditSerializer.toJson(c), null
                        );
                        return auditLogRepository.save(log).thenReturn(c);
                    });
            });
    }
    
    @Override
    public Mono<Void> delete(UUID id, UUID userId) {
        return customerRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Customer not found: " + id)))
            .flatMap(existing -> {
                AuditLog log = AuditLog.create(
                    userId, "CUSTOMER", id, "DELETE",
                    auditSerializer.toJson(existing), null, null
                );
                return auditLogRepository.save(log)
                    .then(customerRepository.deleteById(id));
            });
    }
    
    @Override
    public Mono<Void> deleteAll(List<UUID> ids) {
        if (ids.isEmpty()) return Mono.empty();
        return customerRepository.deleteAllById(ids);
    }
    
    @Override
    public Mono<Customer> activate(UUID id, UUID userId) {
        return customerRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Customer not found: " + id)))
            .map(Customer::activate)
            .flatMap(c -> customerRepository.save(c)
                .flatMap(saved -> {
                    AuditLog log = AuditLog.create(
                        userId, "CUSTOMER", saved.getId(), "ACTIVATE",
                        null, auditSerializer.toJson(saved), null
                    );
                    return auditLogRepository.save(log).thenReturn(saved);
                }));
    }
    
    @Override
    public Mono<Customer> deactivate(UUID id, UUID userId) {
        return customerRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Customer not found: " + id)))
            .map(Customer::deactivate)
            .flatMap(c -> customerRepository.save(c)
                .flatMap(saved -> {
                    AuditLog log = AuditLog.create(
                        userId, "CUSTOMER", saved.getId(), "DEACTIVATE",
                        null, auditSerializer.toJson(saved), null
                    );
                    return auditLogRepository.save(log).thenReturn(saved);
                }));
    }
}
