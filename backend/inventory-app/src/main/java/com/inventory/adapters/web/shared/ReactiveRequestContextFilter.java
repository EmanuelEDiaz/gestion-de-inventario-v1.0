package com.inventory.adapters.web.shared;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class ReactiveRequestContextFilter implements WebFilter {

    static final Class<ServerWebExchange> EXCHANGE_KEY = ServerWebExchange.class;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        return chain.filter(exchange)
            .contextWrite(ctx -> ctx.put(EXCHANGE_KEY, exchange));
    }
}
