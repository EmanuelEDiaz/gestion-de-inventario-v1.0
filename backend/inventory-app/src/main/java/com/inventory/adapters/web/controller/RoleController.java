package com.inventory.adapters.web.controller;

import com.inventory.adapters.web.dto.CreateRoleRequest;
import com.inventory.adapters.web.dto.PermissionResponse;
import com.inventory.adapters.web.dto.RoleResponse;
import com.inventory.adapters.web.dto.UpdateRoleRequest;
import com.inventory.domain.model.Permission;
import com.inventory.domain.model.Role;
import com.inventory.domain.ports.in.RoleCommandPort;
import com.inventory.domain.ports.in.RoleQueryPort;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/roles")
@PreAuthorize("hasRole('ADMIN')")
public class RoleController {

    private final RoleQueryPort roleQuery;
    private final RoleCommandPort roleCommand;

    public RoleController(RoleQueryPort roleQuery, RoleCommandPort roleCommand) {
        this.roleQuery = roleQuery;
        this.roleCommand = roleCommand;
    }

    @GetMapping
    public Flux<RoleResponse> getAll() {
        return roleQuery.findAll().map(this::toResponse);
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<RoleResponse>> getById(@PathVariable UUID id) {
        return roleQuery.findById(id)
            .map(r -> ResponseEntity.ok(toResponse(r)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Mono<ResponseEntity<RoleResponse>> create(@Valid @RequestBody CreateRoleRequest request) {
        var permIds = request.permissionIds() != null ? new HashSet<>(request.permissionIds()) : new HashSet<UUID>();
        var command = new RoleCommandPort.CreateRoleCommand(
            request.code(), request.name(), request.description(), permIds
        );
        return roleCommand.createRole(command)
            .map(saved -> ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved)));
    }

    @PatchMapping("/{id}")
    public Mono<ResponseEntity<RoleResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRoleRequest request) {
        var permIds = request.permissionIds() != null ? new HashSet<>(request.permissionIds()) : null;
        var command = new RoleCommandPort.UpdateRoleCommand(request.name(), request.description(), permIds);
        return roleCommand.updateRole(id, command)
            .map(updated -> ResponseEntity.ok(toResponse(updated)));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> deactivate(@PathVariable UUID id) {
        return roleCommand.deactivateRole(id)
            .thenReturn(ResponseEntity.<Void>noContent().build());
    }

    private RoleResponse toResponse(Role role) {
        List<PermissionResponse> perms = role.getPermissions().stream()
            .map(p -> new PermissionResponse(p.getId(), p.getCode(), p.getName(), p.getCategory()))
            .toList();
        return new RoleResponse(
            role.getId(), role.getCode(), role.getName(), role.getDescription(),
            role.isSystem(), role.isActive(), perms, role.getCreatedAt(), role.getUpdatedAt()
        );
    }
}
