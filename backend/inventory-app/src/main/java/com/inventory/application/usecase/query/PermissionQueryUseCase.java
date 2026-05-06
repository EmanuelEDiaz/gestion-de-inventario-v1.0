package com.inventory.application.usecase.query;

import com.inventory.domain.model.Permission;
import com.inventory.domain.ports.in.PermissionQueryPort;
import com.inventory.domain.ports.out.PermissionRepositoryPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
public class PermissionQueryUseCase implements PermissionQueryPort {

    private final PermissionRepositoryPort permissionRepository;

    public PermissionQueryUseCase(PermissionRepositoryPort permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    @Override
    public Flux<Permission> findAll() {
        return permissionRepository.findAll();
    }
}
