package com.inventory.application.usecase.query.category;

import com.inventory.domain.model.category.Category;
import com.inventory.domain.ports.in.category.CategoryQueryPort;
import com.inventory.domain.ports.out.CategoryRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: Consultas de Categorías.
 */
@Service
public class CategoryQueryUseCase implements CategoryQueryPort {

    private final CategoryRepository categoryRepository;

    public CategoryQueryUseCase(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public Mono<Category> findById(UUID id) {
        return categoryRepository.findById(id);
    }

    @Override
    public Flux<Category> findAll(boolean activeOnly) {
        return activeOnly 
            ? categoryRepository.findAllActive() 
            : categoryRepository.findAll();
    }

    @Override
    public Flux<Category> findByParent(UUID parentId) {
        return categoryRepository.findByParentId(parentId);
    }

    @Override
    public Flux<Category> findRootCategories() {
        return categoryRepository.findRoots();
    }
}
