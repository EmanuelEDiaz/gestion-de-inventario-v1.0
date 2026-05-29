package com.inventory.domain.errors;

public class ImportException extends DomainException {
    public ImportException(String message) {
        super("IMPORT_ERROR", message);
    }
    public ImportException(String message, Throwable cause) {
        super("IMPORT_ERROR", message, cause);
    }
}
