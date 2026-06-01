package com.inventory.application.usecase.command.supplier;

import com.inventory.application.shared.AuditLogger;
import com.inventory.application.shared.AuditSerializer;
import com.inventory.domain.model.supplier.Supplier;
import com.inventory.domain.ports.in.supplier.SupplierCommandPort;
import com.inventory.domain.ports.out.SupplierRepository;
import com.inventory.domain.ports.out.SyncLogWriterPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

@Service
public class SupplierCommandUseCase implements SupplierCommandPort {

    private final SupplierRepository supplierRepository;
    private final AuditLogger auditLogger;
    private final SyncLogWriterPort syncLogWriter;
    private final AuditSerializer auditSerializer;

    public SupplierCommandUseCase(SupplierRepository supplierRepository,
                                  AuditLogger auditLogger,
                                  SyncLogWriterPort syncLogWriter,
                                  AuditSerializer auditSerializer) {
        this.supplierRepository = supplierRepository;
        this.auditLogger = auditLogger;
        this.syncLogWriter = syncLogWriter;
        this.auditSerializer = auditSerializer;
    }

    @Override
    public Mono<Supplier> create(CreateCommand command, UUID userId) {
        Supplier supplier = Supplier.create(
            command.code(),
            command.name(),
            command.contactName(),
            command.phone(),
            command.email(),
            command.province(),
            command.municipality(),
            command.street(),
            command.locality(),
            command.zipCode(),
            command.latitude(),
            command.longitude()
        );

        if (command.address() != null || command.notes() != null || command.website() != null) {
            supplier = supplier.update(
                command.code(),
                command.name(),
                command.contactName(),
                command.phone(),
                command.email(),
                command.address(),
                command.notes(),
                command.website(),
                command.province(),
                command.municipality(),
                command.street(),
                command.locality(),
                command.zipCode(),
                command.latitude(),
                command.longitude()
            );
        }

        return supplierRepository.save(supplier)
            .flatMap(saved -> auditLogger.log(userId, "SUPPLIER", saved.getId(), "CREATE", null, auditSerializer.toJsonTruncated(saved))
                .then(syncLogWriter.log("SUPPLIER", saved.getId(), "CREATE", saved, null))
                .thenReturn(saved));
    }

    @Override
    public Mono<Supplier> update(UUID id, UpdateCommand command, UUID userId) {
        return supplierRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Supplier not found: " + id)))
            .flatMap(existing -> {
                String beforeJson = auditSerializer.toJsonTruncated(existing);
                Supplier updated = existing.update(
                    command.code(),
                    command.name(),
                    command.contactName(),
                    command.phone(),
                    command.email(),
                    command.address(),
                    command.notes(),
                    command.website(),
                    command.province(),
                    command.municipality(),
                    command.street(),
                    command.locality(),
                    command.zipCode(),
                    command.latitude(),
                    command.longitude()
                );
                return supplierRepository.save(updated)
                    .flatMap(saved -> auditLogger.log(userId, "SUPPLIER", id, "UPDATE", beforeJson, auditSerializer.toJsonTruncated(saved))
                        .then(syncLogWriter.log("SUPPLIER", id, "UPDATE", saved, null))
                        .thenReturn(saved));
            });
    }

    @Override
    public Mono<Void> delete(UUID id, UUID userId) {
        return supplierRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Supplier not found: " + id)))
            .flatMap(existing -> {
                String beforeJson = auditSerializer.toJsonTruncated(existing);
                return auditLogger.log(userId, "SUPPLIER", id, "DELETE", beforeJson, null)
                    .then(supplierRepository.deleteById(id))
                    .then(syncLogWriter.log("SUPPLIER", id, "DELETE", existing, null));
            });
    }

    @Override
    public Mono<Void> deleteAll(List<UUID> ids) {
        if (ids.isEmpty()) return Mono.empty();
        return supplierRepository.deleteAllById(ids);
    }

    @Override
    public Mono<Supplier> activate(UUID id, UUID userId) {
        return supplierRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Supplier not found: " + id)))
            .flatMap(existing -> {
                Supplier activated = existing.activate();
                return supplierRepository.save(activated)
                    .flatMap(saved -> auditLogger.log(userId, "SUPPLIER", id, "ACTIVATE", null, auditSerializer.toJsonTruncated(saved))
                        .then(syncLogWriter.log("SUPPLIER", id, "ACTIVATE", saved, null))
                        .thenReturn(saved));
            });
    }

    @Override
    public Mono<Supplier> deactivate(UUID id, UUID userId) {
        return supplierRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Supplier not found: " + id)))
            .flatMap(existing -> {
                Supplier deactivated = existing.deactivate();
                return supplierRepository.save(deactivated)
                    .flatMap(saved -> auditLogger.log(userId, "SUPPLIER", id, "DEACTIVATE", null, auditSerializer.toJsonTruncated(saved))
                        .then(syncLogWriter.log("SUPPLIER", id, "DEACTIVATE", saved, null))
                        .thenReturn(saved));
            });
    }
}
