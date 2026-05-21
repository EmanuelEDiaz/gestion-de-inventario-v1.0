package com.inventory.domain.ports.in.role;

import com.inventory.domain.model.role.Role;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface RoleQueryPort {

    Flux<Role> findAll();

    Mono<Role> findById(UUID id);
}
