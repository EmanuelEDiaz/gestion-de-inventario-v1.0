package com.inventory.application.usecase.command;

import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.errors.ConflictException;
import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.category.Category;
import com.inventory.domain.ports.in.category.CategoryCommandPort;
import com.inventory.domain.ports.out.CategoryRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: Comandos de Categorías.
 */
@Service
public class CategoryCommandUseCase implements CategoryCommandPort {

    private final CategoryRepository categoryRepository;

    public CategoryCommandUseCase(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public Mono<Category> create(CreateCategoryCommand command) {
        return validateUniqueName(command.name(), command.parentId())
            .then(createCategory(command));
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
    public Mono<Category> update(UUID id, UpdateCategoryCommand command) {
        return categoryRepository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Categoría", id.toString())))
            .flatMap(existing -> {
                UUID newParentId = command.parentId() != null ? command.parentId() : existing.getParentId();
                String newName = command.name() != null ? command.name() : existing.getName();
                
                // Validar que no se asigne a sí misma como parent
                if (command.parentId() != null && command.parentId().equals(id)) {
                    return Mono.error(new BadRequestException("Una categoría no puede ser su propia padre"));
                }
                
                // Validar nombre único si cambia
                Mono<Void> nameValidation = (command.name() != null && !command.name().equals(existing.getName()))
                    ? validateUniqueName(newName, newParentId)
                    : Mono.empty();
                
                return nameValidation.thenReturn(existing);
            })
            .map(existing -> {
                Category updated = existing;
                if (command.name() != null) {
                    updated = updated.rename(command.name());
                }
                if (command.sortOrder() > 0) {
                    updated = updated.reorder(command.sortOrder());
                }
                return updated;
            })
            .flatMap(categoryRepository::save);
    }

    @Override
    public Mono<Void> delete(UUID id) {
        return categoryRepository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Categoría", id.toString())))
            .flatMap(category -> categoryRepository.countProducts(id)
                .flatMap(count -> count > 0
                    ? Mono.error(new ConflictException("No se puede eliminar una categoría con productos asociados"))
                    : categoryRepository.deleteById(id)));
    }

    private Mono<Void> validateUniqueName(String name, UUID parentId) {
        return categoryRepository.existsByNameAndParentId(name, parentId)
            .flatMap(exists -> exists
                ? Mono.error(new ConflictException("Ya existe una categoría con ese nombre en el mismo nivel"))
                : Mono.empty());
    }
}
