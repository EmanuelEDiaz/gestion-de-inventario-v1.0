package com.inventory.domain.model.supplier;

import java.util.UUID;

/**
 * Value Object: Red social de proveedor.
 * Representa un enlace de contacto o red social asociado a un proveedor.
 */
public record SupplierSocialLink(
    UUID id,
    UUID supplierId,
    Platform platform,
    String url,
    String label,
    int sortOrder
) {
    public enum Platform {
        WHATSAPP, TELEGRAM, INSTAGRAM, FACEBOOK, TIKTOK, WEBSITE, OTHER
    }

    public SupplierSocialLink {
        if (supplierId == null) throw new IllegalArgumentException("supplierId cannot be null");
        if (platform == null) throw new IllegalArgumentException("platform cannot be null");
        if (url == null || url.isBlank()) throw new IllegalArgumentException("url cannot be blank");
        if (id == null) id = UUID.randomUUID();
    }

    public static SupplierSocialLink create(UUID supplierId, Platform platform, String url,
                                            String label, int sortOrder) {
        return new SupplierSocialLink(UUID.randomUUID(), supplierId, platform, url, label, sortOrder);
    }
}
