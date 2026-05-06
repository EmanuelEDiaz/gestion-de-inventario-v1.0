package com.inventory.adapters.persistence;

import com.inventory.adapters.persistence.mapper.PersistenceMapper;
import com.inventory.adapters.persistence.repository.PermissionR2dbcRepository;
import com.inventory.domain.model.Permission;
import com.inventory.domain.ports.out.PermissionRepositoryPort;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;
import java.util.UUID;

@Component
public class PermissionRepositoryAdapter implements PermissionRepositoryPort {

    private final PermissionR2dbcRepository repository;
    private final PersistenceMapper mapper;

    public PermissionRepositoryAdapter(PermissionR2dbcRepository repository, PersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Flux<Permission> findAll() {
        return repository.findAllOrdered().map(mapper::toDomain);
    }

    @Override
    public Flux<Permission> findByIds(Set<UUID> ids) {
        if (ids == null || ids.isEmpty()) return Flux.empty();
        return repository.findByIdIn(ids).map(mapper::toDomain);
    }

    @Override
    public Mono<Permission> findById(UUID id) {
        return repository.findById(id).map(mapper::toDomain);
    }
}
