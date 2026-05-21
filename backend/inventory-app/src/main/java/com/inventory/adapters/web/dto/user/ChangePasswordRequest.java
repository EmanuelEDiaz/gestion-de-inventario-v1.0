package com.inventory.adapters.web.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
    String currentPassword,

    @NotBlank @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    String newPassword
) {}
