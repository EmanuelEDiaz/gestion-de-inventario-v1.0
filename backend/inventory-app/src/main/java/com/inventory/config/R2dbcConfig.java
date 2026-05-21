package com.inventory.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;

/**
 * Configuración de R2DBC y repositorios.
 */
@Configuration
@EnableR2dbcRepositories(basePackages = "com.inventory.adapters.persistence.adapter.repository")
public class R2dbcConfig {
}
