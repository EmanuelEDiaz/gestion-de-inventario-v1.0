package com.inventory.application.usecase.command.category;

import com.inventory.application.shared.AuditSerializer;
import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.errors.ConflictException;
import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.audit.AuditLog;
import com.inventory.domain.model.category.Category;
import com.inventory.domain.ports.in.category.CategoryCommandPort;
import com.inventory.domain.ports.out.AuditLogRepository;
import com.inventory.domain.ports.out.CategoryRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

/**
 * Caso de uso: Comandos de Categorías.
 */
@Service
public class CategoryCommandUseCase implements CategoryCommandPort {

    private final CategoryRepository categoryRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditSerializer auditSerializer;

    public CategoryCommandUseCase(CategoryRepository categoryRepository,
                                  AuditLogRepository auditLogRepository,
                                  AuditSerializer auditSerializer) {
        this.categoryRepository = categoryRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditSerializer = auditSerializer;
    }

    @Override
    public Mono<Category> create(CreateCategoryCommand command, UUID userId) {
        return validateUniqueName(command.name(), command.parentId())
            .then(createCategory(command))
            .flatMap(saved -> {
                String afterData = auditSerializer.toJsonTruncated(saved);
                AuditLog auditLog = AuditLog.create(userId, "CATEGORY", saved.getId(), "CREATE", null, afterData, null);
                return auditLogRepository.save(auditLog).thenReturn(saved);
            });
    }

    private Mono<Category> createCategory(CreateCategoryCommand command) {
        if (command.parentId() == null) {
            // Categoría raíz
            Category root = Category.createRoot(command.name(), command.sortOrder());
            return categoryRepository.save(root);
        }
        // Categoría hija
        return categoryRepository.findById(command.parentId())
            .switchIfEmpty(Mono.error(new BadRequestException("Categoría padre no encontrada")))
            .map(parent -> Category.createChild(parent, command.name(), command.sortOrder()))
            .flatMap(categoryRepository::save);
    }

    @Override
    public Mono<Category> update(UUID id, UpdateCategoryCommand command, UUID userId) {
        return categoryRepository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Categoría", id.toString())))
            .flatMap(existing -> {
                UUID newParentId = command.parentId() != null ? command.parentId() : existing.getParentId();
                String newName = command.name() != null ? command.name() : existing.getName();

                if (command.parentId() != null && command.parentId().equals(id)) {
                    return Mono.error(new BadRequestException("Una categoría no puede ser su propia padre"));
                }

                Mono<Void> nameValidation = (command.name() != null && !command.name().equals(existing.getName()))
                    ? validateUniqueName(newName, newParentId)
                    : Mono.empty();

                return nameValidation.thenReturn(existing);
            })
            .flatMap(existing -> {
                String beforeData = auditSerializer.toJsonTruncated(existing);
                Category updated = existing;
                if (command.name() != null) {
                    updated = updated.rename(command.name());
                }
                if (command.sortOrder() > 0) {
                    updated = updated.reorder(command.sortOrder());
                }
                final Category toSave = updated;
                return categoryRepository.save(toSave)
                    .flatMap(saved -> {
                        String afterData = auditSerializer.toJsonTruncated(saved);
                        AuditLog auditLog = AuditLog.create(userId, "CATEGORY", id, "UPDATE", beforeData, afterData, null);
                        return auditLogRepository.save(auditLog).thenReturn(saved);
                    });
            });
    }

    @Override
    public Mono<Void> delete(UUID id, UUID userId) {
        return categoryRepository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Categoría", id.toString())))
            .flatMap(category -> categoryRepository.countProducts(id)
                .flatMap(count -> {
                    if (count > 0) {
                        return Mono.error(new ConflictException("No se puede eliminar una categoría con productos asociados"));
                    }
                    String beforeData = auditSerializer.toJsonTruncated(category);
                    AuditLog auditLog = AuditLog.create(userId, "CATEGORY", id, "DELETE", beforeData, null, null);
                    return auditLogRepository.save(auditLog)
                        .then(categoryRepository.deleteById(id));
                }));
    }

    @Override
    public Mono<Void> deleteAll(List<UUID> ids) {
        if (ids.isEmpty()) return Mono.empty();
        return Flux.fromIterable(ids)
            .flatMap(id -> categoryRepository.findById(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Categoría", id.toString())))
                .flatMap(category -> categoryRepository.countProducts(id)
                    .flatMap(count -> count > 0
                        ? Mono.error(new ConflictException("No se puede eliminar una categoría con productos asociados: " + id))
                        : Mono.just(id))))
            .then(categoryRepository.deleteAllById(ids));
    }

    private Mono<Void> validateUniqueName(String name, UUID parentId) {
        return categoryRepository.existsByNameAndParentId(name, parentId)
            .flatMap(exists -> exists
                ? Mono.error(new ConflictException("Ya existe una categoría con ese nombre en el mismo nivel"))
                : Mono.empty());
    }
}
