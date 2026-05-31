package com.inventory.application.usecase.command.role;

import com.inventory.domain.model.role.Role;
import com.inventory.domain.ports.in.role.RoleCommandPort;
import com.inventory.domain.ports.out.PermissionRepositoryPort;
import com.inventory.domain.ports.out.RoleRepositoryPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

@Service
public class RoleCommandUseCase implements RoleCommandPort {

    private final RoleRepositoryPort roleRepository;
    private final PermissionRepositoryPort permissionRepository;

    public RoleCommandUseCase(RoleRepositoryPort roleRepository,
                               PermissionRepositoryPort permissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }

    @Override
    public Mono<Role> createRole(CreateRoleCommand command) {
        return roleRepository.existsByCode(command.code())
                .flatMap(exists -> {
                    if (exists) return Mono.error(new IllegalArgumentException("Ya existe un rol con el código: " + command.code()));
                    Role role = Role.createCustomRole(command.code(), command.name(), command.description(), null);
                    return roleRepository.saveWithPermissions(role, command.permissionIds());
                });
    }

    @Override
    public Mono<Role> updateRole(UUID id, UpdateRoleCommand command) {
        return roleRepository.findById(id)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Rol no encontrado: " + id)))
                .flatMap(existing -> {
                    if (existing.isSystem()) {
                        return Mono.error(new IllegalArgumentException("No se pueden modificar roles de sistema"));
                    }
                    String name = command.name() != null ? command.name() : existing.getName();
                    String description = command.description() != null ? command.description() : existing.getDescription();
                    Role updated = new Role(
                            existing.getId(), existing.getCode(), name, description,
                            false, true, existing.getPermissions(),
                            existing.getCreatedAt(), Instant.now()
                    );
                    return roleRepository.saveWithPermissions(updated, command.permissionIds());
                });
    }

    @Override
    public Mono<Void> deactivateRole(UUID id) {
        return roleRepository.findById(id)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Rol no encontrado: " + id)))
                .flatMap(existing -> {
                    if (existing.isSystem()) {
                        return Mono.error(new IllegalArgumentException("No se pueden desactivar roles de sistema"));
                    }
                    Role deactivated = new Role(
                            existing.getId(), existing.getCode(), existing.getName(),
                            existing.getDescription(), false, false,
                            existing.getPermissions(), existing.getCreatedAt(), Instant.now()
                    );
                    return roleRepository.save(deactivated);
                })
                .then();
    }

    @Override
    public Mono<Void> reactivateRole(UUID id) {
        return roleRepository.findById(id)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Rol no encontrado: " + id)))
                .flatMap(existing -> {
                    if (existing.isSystem()) {
                        return Mono.error(new IllegalArgumentException("No se pueden reactivar roles de sistema"));
                    }
                    Role reactivated = new Role(
                            existing.getId(), existing.getCode(), existing.getName(),
                            existing.getDescription(), false, true,
                            existing.getPermissions(), existing.getCreatedAt(), Instant.now()
                    );
                    return roleRepository.save(reactivated);
                })
                .then();
    }

    @Override
    public Mono<Void> deleteRole(UUID id) {
        return roleRepository.findById(id)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Rol no encontrado: " + id)))
                .flatMap(existing -> {
                    if (existing.isSystem()) {
                        return Mono.error(new IllegalArgumentException("No se pueden eliminar roles de sistema"));
                    }
                    return roleRepository.deleteById(id);
                });
    }
}
