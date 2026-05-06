package com.inventory.application.usecase.query;

import com.inventory.domain.model.Role;
import com.inventory.domain.ports.in.RoleQueryPort;
import com.inventory.domain.ports.out.RoleRepositoryPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
public class RoleQueryUseCase implements RoleQueryPort {

    private final RoleRepositoryPort roleRepository;

    public RoleQueryUseCase(RoleRepositoryPort roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public Flux<Role> findAll() {
        return roleRepository.findAllActive();
    }

    @Override
    public Mono<Role> findById(UUID id) {
        return roleRepository.findById(id);
    }
}
