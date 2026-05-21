package com.inventory.adapters.web.controller.role;

import com.inventory.adapters.web.dto.role.PermissionResponse;
import com.inventory.domain.ports.in.role.PermissionQueryPort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/v1/permissions")
@PreAuthorize("isAuthenticated()")
public class PermissionController {

    private final PermissionQueryPort permissionQuery;

    public PermissionController(PermissionQueryPort permissionQuery) {
        this.permissionQuery = permissionQuery;
    }

    @GetMapping
    public Flux<PermissionResponse> getAll() {
        return permissionQuery.findAll()
            .map(p -> new PermissionResponse(p.getId(), p.getCode(), p.getName(), p.getCategory()));
    }
}
