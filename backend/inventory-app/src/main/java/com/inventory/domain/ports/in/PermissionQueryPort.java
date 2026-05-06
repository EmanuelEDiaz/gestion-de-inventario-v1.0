package com.inventory.domain.ports.in;

import com.inventory.domain.model.Permission;
import reactor.core.publisher.Flux;

public interface PermissionQueryPort {

    Flux<Permission> findAll();
}
