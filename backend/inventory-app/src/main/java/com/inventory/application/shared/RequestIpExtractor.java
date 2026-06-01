package com.inventory.application.shared;

import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class RequestIpExtractor {

    public static Mono<String> getIp() {
        return Mono.deferContextual(ctx -> {
            ServerWebExchange exchange = ctx.getOrDefault(ServerWebExchange.class, null);
            if (exchange == null) return Mono.empty();
            String forwarded = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank())
                return Mono.just(forwarded.split(",")[0].trim());
            if (exchange.getRequest().getRemoteAddress() != null)
                return Mono.just(exchange.getRequest().getRemoteAddress().getAddress().getHostAddress());
            return Mono.empty();
        });
    }
}
