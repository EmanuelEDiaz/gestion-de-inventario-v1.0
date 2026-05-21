package com.inventory.application.supplier.dto;

import java.util.UUID;

public record SupplierSocialLinkDto(
    UUID id,
    UUID supplierId,
    String platform,
    String url,
    String label,
    int sortOrder
) {}
