package com.inventory.adapters.web.dto.product;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

public record PaginatedProductResponse(
    List<ProductResponse> content,
    long totalElements,
    int totalPages,
    int size,
    int number,
    @JsonInclude(JsonInclude.Include.NON_NULL) String chunkChecksum
) {

    public static PaginatedProductResponse of(
        List<ProductResponse> content,
        long totalElements,
        int totalPages,
        int size,
        int number,
        String checksum
    ) {
        return new PaginatedProductResponse(
            content, totalElements, totalPages, size, number, checksum
        );
    }
}
