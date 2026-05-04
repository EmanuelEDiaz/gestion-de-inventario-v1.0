package com.inventory.adapters.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateUserRequest(
    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(max = 100)
    String username,

    String email,

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    String password,

    @NotBlank(message = "El nombre para mostrar es obligatorio")
    @Size(max = 200)
    String displayName,

    @NotNull(message = "El rol es obligatorio")
    UUID roleId
) {}
