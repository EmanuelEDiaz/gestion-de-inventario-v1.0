package com.inventory.adapters.web.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.http.ResponseEntity;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public final class ChecksumUtils {

    public static final String CHECKSUM_HEADER = "X-Content-Checksum";
    public static final String CHECKSUM_PREFIX = "sha256:";

    private ChecksumUtils() {}

    public static <T> Mono<ResponseEntity<Flux<T>>> withChecksum(Flux<T> body, ObjectMapper mapper) {
        return body.collectList()
            .map(list -> ResponseEntity.ok()
                .header(CHECKSUM_HEADER, checksumOf(list, mapper))
                .body(Flux.fromIterable(list)));
    }

    public static String checksumOf(List<?> list, ObjectMapper mapper) {
        try {
            String json = mapper.writeValueAsString(list);
            return CHECKSUM_PREFIX + DigestUtils.sha256Hex(json);
        } catch (JsonProcessingException e) {
            return CHECKSUM_PREFIX + "error";
        }
    }

    public static String checksumOf(ObjectMapper mapper, Object... items) {
        try {
            String json = mapper.writeValueAsString(List.of(items));
            return CHECKSUM_PREFIX + DigestUtils.sha256Hex(json);
        } catch (JsonProcessingException e) {
            return CHECKSUM_PREFIX + "error";
        }
    }
}
