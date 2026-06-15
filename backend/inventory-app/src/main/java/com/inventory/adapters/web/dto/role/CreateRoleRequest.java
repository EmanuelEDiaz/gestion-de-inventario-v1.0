package com.inventory.adapters.web.dto.role;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreateRoleRequest(
    @NotBlank @Pattern(regexp = "^[A-Z][A-Z0-9_]{1,49}$", message = "El código debe ser mayúsculas, sin espacios")
    String code,

    @NotBlank @Size(max = 200)
    String name,

    @Size(max = 500)
    String description,

    List<UUID> permissionIds
) {}
