package com.inventory.domain.shared;

public record PageRequest(int offset, int limit) {
    public PageRequest {
        if (offset < 0) throw new IllegalArgumentException("offset must be >= 0");
        if (limit < 1) throw new IllegalArgumentException("limit must be >= 1");
    }

    public static PageRequest of(int page, int size) {
        return new PageRequest(page * size, size);
    }

    public int getPage() {
        return offset / limit;
    }

    public int getOffset() {
        return offset;
    }

    public int getLimit() {
        return limit;
    }
}
