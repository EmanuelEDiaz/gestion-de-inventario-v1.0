package com.inventory.domain.errors;

/**
 * Excepción de dominio: la configuración fue modificada por otro usuario
 * mientras el cliente mantenía una versión desactualizada (optimistic lock).
 *
 * Retorna HTTP 409 Conflict con un mensaje claro para el usuario.
 */
public class SettingsVersionConflictException extends DomainException {

    private final int clientVersion;
    private final int currentVersion;

    public SettingsVersionConflictException(int clientVersion, int currentVersion) {
        super("SETTINGS_VERSION_CONFLICT",
                "La configuración fue modificada por otro usuario (versión " + currentVersion +
                "). Actualiza la página para ver los cambios más recientes antes de guardar.");
        this.clientVersion = clientVersion;
        this.currentVersion = currentVersion;
    }

    public int getClientVersion() { return clientVersion; }
    public int getCurrentVersion() { return currentVersion; }
}
