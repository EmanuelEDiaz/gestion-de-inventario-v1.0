package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.RoleEntity;
import com.inventory.adapters.persistence.adapter.mapper.PersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.PermissionR2dbcRepository;
import com.inventory.adapters.persistence.adapter.repository.RoleR2dbcRepository;
import com.inventory.adapters.persistence.adapter.repository.UserR2dbcRepository;
import com.inventory.domain.model.user.User;
import com.inventory.domain.ports.out.UserRepositoryPort;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.UUID;

/**
 * Adaptador de persistencia para usuarios.
 * Implementa el puerto de salida del dominio.
 */
@Component
public class UserRepositoryAdapter implements UserRepositoryPort {
    
    private final UserR2dbcRepository userRepository;
    private final RoleR2dbcRepository roleRepository;
    private final PermissionR2dbcRepository permissionRepository;
    private final PersistenceMapper mapper;
    
    public UserRepositoryAdapter(UserR2dbcRepository userRepository,
                                  RoleR2dbcRepository roleRepository,
                                  PermissionR2dbcRepository permissionRepository,
                                  PersistenceMapper mapper) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.mapper = mapper;
    }
    
    @Override
    public Mono<User> findByUsername(String username) {
        return userRepository.findByUsername(username)
                .flatMap(this::loadUserWithRole);
    }
    
    @Override
    public Mono<User> findById(UUID id) {
        return userRepository.findById(id)
                .flatMap(this::loadUserWithRole);
    }
    
    @Override
    public Mono<User> save(User user) {
        return userRepository.save(mapper.toEntity(user))
                .flatMap(this::loadUserWithRole);
    }
    
    @Override
    public Mono<Boolean> existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public Mono<Boolean> existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public Flux<User> findAll() {
        return userRepository.findAll().flatMap(this::loadUserWithRole);
    }

    /**
     * Carga el usuario con su rol y permisos asociados.
     */
    private Mono<User> loadUserWithRole(com.inventory.adapters.persistence.adapter.entity.UserEntity userEntity) {
        if (userEntity.getRoleId() == null) {
            return Mono.just(mapper.toDomain(userEntity, null));
        }
        
        return roleRepository.findById(userEntity.getRoleId())
                .flatMap(this::loadRoleWithPermissions)
                .map(role -> mapper.toDomain(userEntity, mapper.toDomain(role)));
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
