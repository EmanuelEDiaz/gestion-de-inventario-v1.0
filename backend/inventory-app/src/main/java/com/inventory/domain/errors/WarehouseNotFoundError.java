package com.inventory.domain.errors;

import java.util.UUID;

public class WarehouseNotFoundError extends DomainException {

    private final UUID warehouseId;

    public WarehouseNotFoundError(UUID warehouseId) {
        super("WAREHOUSE_NOT_FOUND", "Almacén no encontrado: " + warehouseId);
        this.warehouseId = warehouseId;
    }

    public WarehouseNotFoundError(String identifier) {
        super("WAREHOUSE_NOT_FOUND", "Almacén no encontrado: " + identifier);
        this.warehouseId = UUID.fromString(identifier);
    }

    public UUID getWarehouseId() {
        return warehouseId;
    }
}
