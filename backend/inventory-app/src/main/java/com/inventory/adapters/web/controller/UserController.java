package com.inventory.adapters.web.controller;

import com.inventory.adapters.web.dto.CreateUserRequest;
import com.inventory.adapters.web.dto.UpdateUserRequest;
import com.inventory.adapters.web.dto.UserResponse;
import com.inventory.domain.model.User;
import com.inventory.domain.ports.in.AdminUserCommandPort;
import com.inventory.domain.ports.in.AdminUserQueryPort;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final AdminUserQueryPort userQuery;
    private final AdminUserCommandPort userCommand;

    public UserController(AdminUserQueryPort userQuery, AdminUserCommandPort userCommand) {
        this.userQuery   = userQuery;
        this.userCommand = userCommand;
    }

    @GetMapping
    public Flux<UserResponse> getAll() {
        return userQuery.findAll().map(this::toResponse);
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<UserResponse>> getById(@PathVariable UUID id) {
        return userQuery.findById(id)
            .map(u -> ResponseEntity.ok(toResponse(u)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Mono<ResponseEntity<UserResponse>> create(@Valid @RequestBody CreateUserRequest request) {
        var command = new AdminUserCommandPort.CreateUserCommand(
            request.username(), request.email(), request.password(),
            request.displayName(), request.roleId()
        );
        return userCommand.createUser(command)
            .map(saved -> ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved)));
    }

    @PatchMapping("/{id}")
    public Mono<ResponseEntity<UserResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        var command = new AdminUserCommandPort.UpdateUserCommand(
            request.email(), request.displayName(), request.roleId(), request.isActive()
        );
        return userCommand.updateUser(id, command)
            .map(updated -> ResponseEntity.ok(toResponse(updated)));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> deactivate(@PathVariable UUID id) {
        return userCommand.deactivateUser(id)
            .thenReturn(ResponseEntity.<Void>noContent().build());
    }

    private UserResponse toResponse(User u) {
        return new UserResponse(
            u.getId(), u.getUsername(), u.getEmail(), u.getDisplayName(),
            u.getRole() != null ? u.getRole().getCode() : null,
            u.isActive(), u.getCreatedAt(), u.getUpdatedAt()
        );
    }
}
