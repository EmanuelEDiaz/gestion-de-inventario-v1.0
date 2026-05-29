package com.inventory.adapters.web.shared;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.inventory.application.shared.AuditSerializer;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Collection;

@Component
public class AuditSerializerImpl implements AuditSerializer {
    private final ObjectMapper objectMapper;
    private static final int MAX_BYTES = 8_192;

    public AuditSerializerImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    @Override
    public String toJsonTruncated(Object obj) {
        Object truncated = truncateCollections(obj, MAX_BYTES / 1024);
        String json = toJson(truncated);
        if (json.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) {
            return "{\"_truncated\":true,\"_size\":" + json.length() + "}";
        }
        return json;
    }

    private Object truncateCollections(Object obj, int maxFields) {
        if (obj == null) return null;
        if (obj instanceof Collection<?> col) {
            return col.stream().limit(maxFields).toList();
        }
        if (obj.getClass().getName().startsWith("com.inventory")) {
            try {
                JsonNode root = objectMapper.valueToTree(obj);
                if (root instanceof ObjectNode onode) {
                    onode.fieldNames().forEachRemaining(f -> {
                        JsonNode v = onode.get(f);
                        if (v != null && v.isArray() && v.size() > maxFields) {
                            ArrayNode arr = objectMapper.createArrayNode();
                            for (int i = 0; i < maxFields; i++) arr.add(v.get(i));
                            onode.set(f, arr);
                        }
                    });
                }
                return root;
            } catch (Exception e) {
                return obj;
            }
        }
        return obj;
    }
}
