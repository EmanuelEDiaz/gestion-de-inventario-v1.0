package com.inventory.domain.ports.out;

import com.inventory.domain.model.role.Permission;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;
import java.util.UUID;

public interface PermissionRepositoryPort {

    Flux<Permission> findAll();

    Flux<Permission> findByIds(Set<UUID> ids);

    Mono<Permission> findById(UUID id);
}
