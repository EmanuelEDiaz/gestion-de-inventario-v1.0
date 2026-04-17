package com.inventory.adapters.persistence;

import com.inventory.adapters.persistence.entity.RoleEntity;
import com.inventory.adapters.persistence.mapper.PersistenceMapper;
import com.inventory.adapters.persistence.repository.PermissionR2dbcRepository;
import com.inventory.adapters.persistence.repository.RoleR2dbcRepository;
import com.inventory.domain.model.Role;
import com.inventory.domain.ports.out.RoleRepositoryPort;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
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
    
    public RoleRepositoryAdapter(RoleR2dbcRepository roleRepository,
                                  PermissionR2dbcRepository permissionRepository,
                                  PersistenceMapper mapper) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.mapper = mapper;
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
