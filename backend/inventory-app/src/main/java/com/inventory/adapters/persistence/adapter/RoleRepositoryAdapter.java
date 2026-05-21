package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.RoleEntity;
import com.inventory.adapters.persistence.adapter.mapper.PersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.PermissionR2dbcRepository;
import com.inventory.adapters.persistence.adapter.repository.RoleR2dbcRepository;
import com.inventory.domain.model.role.Role;
import com.inventory.domain.ports.out.RoleRepositoryPort;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Adaptador de persistencia para roles.
 * Implementa el puerto de salida del dominio.
 */
@Component
public class RoleRepositoryAdapter implements RoleRepositoryPort {
    
    private final RoleR2dbcRepository roleRepository;
    private final PermissionR2dbcRepository permissionRepository;
    private final PersistenceMapper mapper;
    private final DatabaseClient databaseClient;
    
    public RoleRepositoryAdapter(RoleR2dbcRepository roleRepository,
                                  PermissionR2dbcRepository permissionRepository,
                                  PersistenceMapper mapper,
                                  DatabaseClient databaseClient) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.mapper = mapper;
        this.databaseClient = databaseClient;
    }
    
    @Override
    public Mono<Role> findById(UUID id) {
        return roleRepository.findById(id)
                .flatMap(this::loadRoleWithPermissions)
                .map(mapper::toDomain);
    }
    
    @Override
    public Mono<Role> findByCode(String code) {
        return roleRepository.findByCode(code)
                .flatMap(this::loadRoleWithPermissions)
                .map(mapper::toDomain);
    }
    
    @Override
    public Flux<Role> findAllActive() {
        return roleRepository.findByIsActiveTrue()
                .flatMap(this::loadRoleWithPermissions)
                .map(mapper::toDomain);
    }
    
    @Override
    public Mono<Role> save(Role role) {
        return roleRepository.save(mapper.toEntity(role))
                .flatMap(this::loadRoleWithPermissions)
                .map(mapper::toDomain);
    }
    
    @Override
    public Mono<Boolean> existsByCode(String code) {
        return roleRepository.existsByCode(code);
    }
    
    @Override
    public Mono<Role> saveWithPermissions(Role role, Set<UUID> permissionIds) {
        return roleRepository.save(mapper.toEntity(role))
                .flatMap(saved -> replacePermissions(saved.getId(), permissionIds)
                        .then(loadRoleWithPermissions(saved)))
                .map(mapper::toDomain);
    }

    private Mono<Void> replacePermissions(UUID roleId, Set<UUID> permissionIds) {
        Mono<Void> deleteExisting = databaseClient
                .sql("DELETE FROM role_permissions WHERE role_id = :roleId")
                .bind("roleId", roleId)
                .then();
        if (permissionIds == null || permissionIds.isEmpty()) return deleteExisting;
        return deleteExisting.thenMany(
                Flux.fromIterable(permissionIds)
                        .flatMap(pid -> databaseClient
                                .sql("INSERT INTO role_permissions (role_id, permission_id) VALUES (:roleId, :permId)")
                                .bind("roleId", roleId)
                                .bind("permId", pid)
                                .then()))
                .then();
    }

    /**
     * Carga el rol con sus permisos asociados.
     */
    private Mono<RoleEntity> loadRoleWithPermissions(RoleEntity role) {
        return permissionRepository.findByRoleId(role.getId())
                .collectList()
                .map(permissions -> {
                    role.setPermissions(new HashSet<>(permissions));
                    return role;
                });
    }
}
