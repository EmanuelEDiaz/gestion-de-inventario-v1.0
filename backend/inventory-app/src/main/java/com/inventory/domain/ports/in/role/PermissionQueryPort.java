package com.inventory.domain.ports.in.role;

import com.inventory.domain.model.role.Permission;
import reactor.core.publisher.Flux;

public interface PermissionQueryPort {

    Flux<Permission> findAll();
}
