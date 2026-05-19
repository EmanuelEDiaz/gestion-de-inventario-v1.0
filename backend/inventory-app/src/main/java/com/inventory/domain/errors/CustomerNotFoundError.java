package com.inventory.domain.errors;

import java.util.UUID;

public class CustomerNotFoundError extends DomainException {

    private final UUID customerId;

    public CustomerNotFoundError(UUID customerId) {
        super("CUSTOMER_NOT_FOUND", "Cliente no encontrado: " + customerId);
        this.customerId = customerId;
    }

    public CustomerNotFoundError(String identifier) {
        super("CUSTOMER_NOT_FOUND", "Cliente no encontrado: " + identifier);
        this.customerId = UUID.fromString(identifier);
    }

    public UUID getCustomerId() {
        return customerId;
    }
}
