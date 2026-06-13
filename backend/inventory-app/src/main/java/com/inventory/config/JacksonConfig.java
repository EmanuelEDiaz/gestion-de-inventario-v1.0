package com.inventory.config;

import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer bigDecimalCanonicalCustomizer() {
        SimpleModule module = new SimpleModule("BigDecimalCanonical");
        module.addSerializer(BigDecimal.class, new CanonicalBigDecimalSerializer());
        return builder -> builder.modulesToInstall(module);
    }
}
