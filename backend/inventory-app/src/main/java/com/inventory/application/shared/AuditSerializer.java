package com.inventory.application.shared;

public interface AuditSerializer {
    String toJson(Object obj);
    String toJsonTruncated(Object obj);
}
