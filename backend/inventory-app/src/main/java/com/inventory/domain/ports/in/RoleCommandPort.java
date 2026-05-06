package com.inventory.domain.ports.in;

import com.inventory.domain.model.Role;
import reactor.core.publisher.Mono;

import java.util.Set;
import java.util.UUID;

public interface RoleCommandPort {

    Mono<Role> createRole(CreateRoleCommand command);

    Mono<Role> updateRole(UUID id, UpdateRoleCommand command);

    Mono<Void> deactivateRole(UUID id);

    // ===== Command Records =====

    record CreateRoleCommand(
        String code,
        String name,
        String description,
        Set<UUID> permissionIds
    ) {}

    record UpdateRoleCommand(
        String name,
        String description,
        Set<UUID> permissionIds
    ) {}
}
