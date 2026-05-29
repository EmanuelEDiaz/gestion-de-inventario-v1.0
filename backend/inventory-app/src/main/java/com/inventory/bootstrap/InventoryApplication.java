package com.inventory.bootstrap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Punto de entrada principal de la aplicación de inventario.
 * 
 * Arquitectura: Clean Architecture + Hexagonal (Ports & Adapters)
 * Runtime: 100% offline-capable
 */
@SpringBootApplication
@EnableScheduling
@EnableCaching
@ComponentScan(basePackages = "com.inventory")
public class InventoryApplication {

    public static void main(String[] args) {
        SpringApplication.run(InventoryApplication.class, args);
    }
}
