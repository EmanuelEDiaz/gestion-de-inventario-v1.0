package com.inventory.domain.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad de dominio: Almacén.
 * Representa un lugar físico donde se almacena inventario.
 */
public class Warehouse {
    private final UUID id;
    private final String code;
    private final String name;
    private final String address;
    private final boolean active;
    private final Instant createdAt;
    private final Instant updatedAt;
    private final int version;

    public Warehouse(UUID id, String code, String name, String address, 
                     boolean active, Instant createdAt, Instant updatedAt, int version) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Warehouse code cannot be null or blank");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Warehouse name cannot be null or blank");
        }
        this.id = id != null ? id : UUID.randomUUID();
        this.code = code.toUpperCase().trim();
        this.name = name.trim();
        this.address = address;
        this.active = active;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.updatedAt = updatedAt != null ? updatedAt : this.createdAt;
        this.version = version;
    }

    public static Warehouse create(String code, String name, String address) {
        return new Warehouse(
            UUID.randomUUID(),
            code,
            name,
            address,
            true,
            Instant.now(),
            Instant.now(),
            0
        );
    }

    // Getters
    public UUID getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getAddress() { return address; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public int getVersion() { return version; }

    // Métodos de negocio
    public Warehouse update(String name, String address) {
        return new Warehouse(
            this.id,
            this.code,
            name != null ? name : this.name,
            address,
            this.active,
            this.createdAt,
            Instant.now(),
            this.version
        );
    }

    public Warehouse deactivate() {
        return new Warehouse(id, code, name, address, false, createdAt, Instant.now(), version);
    }

    public Warehouse activate() {
        return new Warehouse(id, code, name, address, true, createdAt, Instant.now(), version);
    }

    public Warehouse withVersion(int newVersion) {
        return new Warehouse(id, code, name, address, active, createdAt, updatedAt, newVersion);
    }
}
