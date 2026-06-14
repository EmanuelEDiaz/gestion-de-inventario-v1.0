package com.inventory.domain.errors;

public class ConflictException extends DomainException {

    private final String field;

    public ConflictException(String message) {
        super("CONFLICT", message);
        this.field = null;
    }

    public ConflictException(String field, String value) {
        super("CONFLICT", field + " ya existe: " + value);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
