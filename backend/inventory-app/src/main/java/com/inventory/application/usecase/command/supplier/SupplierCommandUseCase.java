package com.inventory.application.usecase.command.supplier;

import com.inventory.application.shared.AuditSerializer;
import com.inventory.domain.model.audit.AuditLog;
import com.inventory.domain.model.supplier.Supplier;
import com.inventory.domain.ports.in.supplier.SupplierCommandPort;
import com.inventory.domain.ports.out.AuditLogRepository;
import com.inventory.domain.ports.out.SupplierRepository;
import com.inventory.domain.ports.out.SyncLogWriterPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

/**
 * Implementación de comandos de proveedores.
 */
@Service
public class SupplierCommandUseCase implements SupplierCommandPort {

    private final SupplierRepository supplierRepository;
    private final AuditLogRepository auditLogRepository;
    private final SyncLogWriterPort syncLogWriter;
    private final AuditSerializer auditSerializer;

    public SupplierCommandUseCase(SupplierRepository supplierRepository,
                                  AuditLogRepository auditLogRepository,
                                  SyncLogWriterPort syncLogWriter,
                                  AuditSerializer auditSerializer) {
        this.supplierRepository = supplierRepository;
        this.auditLogRepository = auditLogRepository;
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
            command.email()
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
                command.website()
            );
        }

        return supplierRepository.save(supplier)
            .flatMap(saved -> {
                AuditLog log = AuditLog.create(
                    userId, "SUPPLIER", saved.getId(), "CREATE",
                    null, auditSerializer.toJson(saved), null
                );
                return auditLogRepository.save(log)
                    .then(syncLogWriter.log("SUPPLIER", saved.getId(), "CREATE", saved, null))
                    .thenReturn(saved);
            });
    }

    @Override
    public Mono<Supplier> update(UUID id, UpdateCommand command, UUID userId) {
        return supplierRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Supplier not found: " + id)))
            .flatMap(existing -> {
                String beforeJson = auditSerializer.toJson(existing);
                Supplier updated = existing.update(
                    command.code(),
                    command.name(),
                    command.contactName(),
                    command.phone(),
                    command.email(),
                    command.address(),
                    command.notes(),
                    command.website()
                );
                return supplierRepository.save(updated)
                    .flatMap(saved -> {
                        AuditLog log = AuditLog.create(
                            userId, "SUPPLIER", id, "UPDATE",
                            beforeJson, auditSerializer.toJson(saved), null
                        );
                        return auditLogRepository.save(log)
                            .then(syncLogWriter.log("SUPPLIER", id, "UPDATE", saved, null))
                            .thenReturn(saved);
                    });
            });
    }

    @Override
    public Mono<Void> delete(UUID id, UUID userId) {
        return supplierRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Supplier not found: " + id)))
            .flatMap(existing -> {
                String beforeJson = auditSerializer.toJson(existing);
                AuditLog log = AuditLog.create(
                    userId, "SUPPLIER", id, "DELETE",
                    beforeJson, null, null
                );
                return auditLogRepository.save(log)
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
                    .flatMap(saved -> {
                        AuditLog log = AuditLog.create(
                            userId, "SUPPLIER", id, "ACTIVATE",
                            null, auditSerializer.toJson(saved), null
                        );
                        return auditLogRepository.save(log)
                            .then(syncLogWriter.log("SUPPLIER", id, "ACTIVATE", saved, null))
                            .thenReturn(saved);
                    });
            });
    }

    @Override
    public Mono<Supplier> deactivate(UUID id, UUID userId) {
        return supplierRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Supplier not found: " + id)))
            .flatMap(existing -> {
                Supplier deactivated = existing.deactivate();
                return supplierRepository.save(deactivated)
                    .flatMap(saved -> {
                        AuditLog log = AuditLog.create(
                            userId, "SUPPLIER", id, "DEACTIVATE",
                            null, auditSerializer.toJson(saved), null
                        );
                        return auditLogRepository.save(log)
                            .then(syncLogWriter.log("SUPPLIER", id, "DEACTIVATE", saved, null))
                            .thenReturn(saved);
                    });
            });
    }
}
