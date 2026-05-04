package com.inventory.domain.errors;

/**
 * Excepción de dominio: valor del campo de configuración no es válido.
 */
public class InvalidSettingsValueException extends DomainException {

    private final String field;

    public InvalidSettingsValueException(String field, String reason) {
        super("INVALID_SETTINGS_VALUE",
                "Valor inválido para el campo '" + field + "': " + reason);
        this.field = field;
    }

    public String getField() { return field; }
}
